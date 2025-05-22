import json
import os

repos_config = {}
REPOS_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "repos_config.json")

if os.path.exists(REPOS_CONFIG_PATH):
    with open(REPOS_CONFIG_PATH, "r") as f:
        repos_config = json.load(f)
