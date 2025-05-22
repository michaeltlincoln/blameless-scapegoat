import json
import os
import sqlite3

ROOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DB_PATH = os.path.join(ROOT_DIR, "blameless.sqlite")


def dict_from_row(row):
    return dict(zip(row.keys(), row))


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS commit_summary (
                commit_hash TEXT PRIMARY KEY,
                commit_date TEXT,
                total_lines INTEGER,
                total_files INTEGER,
                repo TEXT
            )
        """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_commit_summary_repo ON commit_summary (repo)
        """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS commit_blame (
                commit_hash TEXT,
                file_path TEXT,
                author TEXT,
                lines INTEGER,
                FOREIGN KEY(commit_hash) REFERENCES commit_summary(commit_hash)
            )
        """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_commit_blame_file_path ON commit_blame (file_path)
        """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_commit_blame_author ON commit_blame (author)
        """
        )
        cursor.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_commit_blame_commit_hash_file_path_author ON commit_blame (commit_hash, file_path, author)
        """
        )
        conn.commit()


def insert_blame_analysis(blame_analysis):
    commit_summary_payload = (
        blame_analysis["commit_hash"],
        blame_analysis["commit_date"],
        blame_analysis["total_lines"],
        blame_analysis["total_files"],
        blame_analysis["repo"],
    )
    commit_blame_payloads = [
        (
            blame_analysis["commit_hash"],
            file_path,
            author,
            lines,
        )
        for file_path, author_lines in blame_analysis["blame_by_path"].items()
        for author, lines in author_lines.items()
    ]
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            DELETE FROM commit_summary WHERE commit_hash = ?
        """,
            (blame_analysis["commit_hash"],),
        )
        cursor.execute(
            """
            DELETE FROM commit_blame WHERE commit_hash = ?
        """,
            (blame_analysis["commit_hash"],),
        )
        cursor.execute(
            """
            INSERT INTO commit_summary (commit_hash, commit_date, total_lines, total_files, repo)
            VALUES (?, ?, ?, ?, ?)
        """,
            commit_summary_payload,
        )
        cursor.executemany(
            """
            INSERT INTO commit_blame (commit_hash, file_path, author, lines)
            VALUES (?, ?, ?, ?)
        """,
            commit_blame_payloads,
        )
        conn.commit()


def get_repos():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT repo, COUNT(commit_hash) AS commit_count FROM commit_summary GROUP BY repo
        """
        )
        return [dict_from_row(row) for row in cursor.fetchall()]


def get_commit_summary(repo_name: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                commit_summary.*,
                json_group_object(
                    author,
                    total_author_lines
                ) as scoreboard
            FROM commit_summary
            LEFT JOIN (
                SELECT
                    commit_hash,
                    author,
                    SUM(lines) as total_author_lines
                FROM commit_blame
                GROUP BY commit_hash, author
            ) blame_stats USING(commit_hash)
            WHERE commit_summary.repo = ?
            GROUP BY commit_summary.commit_hash
        """,
            (repo_name,),
        )
        rows = [dict_from_row(row) for row in cursor.fetchall()]
        return [{**row, "scoreboard": json.loads(row["scoreboard"])} for row in rows]


def get_commit_blame(commit_hash: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM commit_blame WHERE commit_hash = ?
        """,
            (commit_hash,),
        )
        return [dict_from_row(row) for row in cursor.fetchall()]


def remove_blame(commit_hash: str):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            DELETE FROM commit_blame WHERE commit_hash = ?
        """,
            (commit_hash,),
        )
        cursor.execute(
            """
            DELETE FROM commit_summary WHERE commit_hash = ?
        """,
            (commit_hash,),
        )
        conn.commit()


def get_directory_structure(commit_hash):
    files = []
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT DISTINCT file_path FROM commit_blame WHERE commit_hash = ?
        """,
            (commit_hash,),
        )
        files = [row[0] for row in cursor.fetchall()]
    structure = {}

    for file_path in files:
        path = file_path.split("/")
        substructure = structure
        for path_part in path[:-1]:
            if path_part not in substructure:
                substructure[path_part] = {}
            substructure = substructure[path_part]
        substructure[path[-1]] = file_path

    return structure
