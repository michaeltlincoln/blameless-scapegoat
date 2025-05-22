import re
from typing import List, Optional

import tqdm
from git import Repo
from repos_config import REPOS_CONFIG_PATH, repos_config


class GitAnalyzer:
    def __init__(self, repo_name: str):
        if repo_name not in repos_config:
            raise ValueError(
                f"Repository '{repo_name}' not found in {REPOS_CONFIG_PATH}."
            )
        repo_config = repos_config[repo_name]
        self.repo_name = repo_name
        self.repo_path = repo_config["path"]
        self.repo = Repo(repo_config["path"])
        self.ignore_patterns = repo_config.get("ignore_patterns", [])
        self.name_mapping = repo_config.get("name_mapping", {})

    def _should_ignore_file(self, file_path: str) -> bool:
        return any(re.match(pattern, file_path) for pattern in self.ignore_patterns)

    def _normalize_name(self, name: str) -> str:
        return self.name_mapping.get(name, name)

    def get_files(self, commit_hash: Optional[str] = None) -> List[str]:
        commit = self.repo.commit(commit_hash) if commit_hash else self.repo.head.commit
        return [
            item.path
            for item in commit.tree.traverse()
            if item.type == "blob" and not self._should_ignore_file(item.path)
        ]

    def analyze_blame(self, commit_hash: Optional[str] = None, verbose: bool = False):
        files = self.get_files(commit_hash)
        resolved_commit_hash = "HEAD" if commit_hash is None else commit_hash
        resolved_commit = (
            self.repo.commit(commit_hash) if commit_hash else self.repo.head.commit
        )

        blame_by_path = {}
        total_lines = 0

        file_range = tqdm.tqdm(files) if verbose else files

        for file_path in file_range:
            blame_by_path[file_path] = {}
            blame = self.repo.blame(resolved_commit_hash, file_path)
            for commit, lines in blame:
                author = self._normalize_name(commit.author.name)
                line_count = len(lines)
                if author not in blame_by_path[file_path]:
                    blame_by_path[file_path][author] = 0
                blame_by_path[file_path][author] += line_count
                total_lines += line_count

        return {
            "total_lines": total_lines,
            "total_files": len(files),
            "blame_by_path": blame_by_path,
            "commit_hash": resolved_commit.hexsha,
            "commit_date": resolved_commit.committed_datetime.isoformat(),
            "repo": self.repo_name,
        }
