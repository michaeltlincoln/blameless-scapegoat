import argparse

from api.db import init_db, remove_blame

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Remove blame commits from a repository"
    )
    parser.add_argument("repo", help="Name of the repository to remove blame from")
    parser.add_argument(
        "--commits",
        "-c",
        nargs="+",
        help="Specific commit hashes to remove blame from",
    )
    args = parser.parse_args()

    init_db()

    for commit in args.commits:
        print(f"Removing blame for commit {commit}...")
        remove_blame(commit)
