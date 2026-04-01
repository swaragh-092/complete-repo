#!/bin/bash

SESSION="sso-stack"

# Create tmux session if not exists
tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
  tmux new-session -d -s $SESSION -n postgres-auth
  tmux send-keys -t $SESSION "docker compose up --build postgres-auth" C-m
fi

# New windows for each container
tmux new-window -t $SESSION -n db-pms
tmux send-keys -t $SESSION "docker compose up --build db-pms" C-m

tmux new-window -t $SESSION -n db-email
tmux send-keys -t $SESSION "docker compose up --build db-email" C-m

tmux new-window -t $SESSION -n db-admin
tmux send-keys -t $SESSION "docker compose up --build db-super-admin" C-m

tmux new-window -t $SESSION -n redis
tmux send-keys -t $SESSION "docker compose up --build redis" C-m

tmux new-window -t $SESSION -n email
tmux send-keys -t $SESSION "docker compose up --build email-service" C-m

tmux new-window -t $SESSION -n auth
tmux send-keys -t $SESSION "docker compose up --build auth-service" C-m

# tmux new-window -t $SESSION -n pms
# tmux send-keys -t $SESSION "docker compose up --build pms" C-m

tmux new-window -t $SESSION -n pms-v2
tmux send-keys -t $SESSION "docker compose up --build pms-v2" C-m

tmux new-window -t $SESSION -n admin
tmux send-keys -t $SESSION "docker compose up --build super-administrator" C-m

tmux new-window -t $SESSION -n auth-ui
tmux send-keys -t $SESSION "docker compose up --build auth-ui" C-m

tmux new-window -t $SESSION -n centralized
tmux send-keys -t $SESSION "docker compose up --build centralized-login" C-m

tmux new-window -t $SESSION -n gateway
tmux send-keys -t $SESSION "docker compose up --build gateway" C-m

# Attach to session
tmux attach -t $SESSION