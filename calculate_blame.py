import argparse

from api.db import init_db, insert_blame_analysis
from api.git_analyzer import GitAnalyzer

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze git blame for a repository")
    parser.add_argument("repo", help="Name of the repository to analyze")
    parser.add_argument(
        "--commits",
        "-c",
        nargs="+",
        help="Specific commit hashes to analyze",
    )
    args = parser.parse_args()

    init_db()
    analyzer = GitAnalyzer(args.repo)

    for commit in args.commits:
        print(f"Analyzing commit {commit}...")
        blame_analysis = analyzer.analyze_blame(commit_hash=commit, verbose=True)
        insert_blame_analysis(blame_analysis)
