# Git Blame Analytics

A web application for analyzing git blame statistics over time, providing insights into who to blame for your tech debt.

## Setup

### API

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy repos configuration and configure:
```bash
cp repos_config.example.json repos_config.json
```

### UI

1. Install dependencies:
```bash
cd ui
yarn
```

### Run Servers

1. Start servers:
```bash
./run.sh
```

2. Shut down servers using ^C

## Loading Data

1. After configuring your repos in repos_config.json, run the `calculate_blame.py` script:

```bash
python calculate_blame.py <repo_name> -c <commit1> <commit2> ...
```