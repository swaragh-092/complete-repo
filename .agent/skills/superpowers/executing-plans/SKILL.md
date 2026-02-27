---
name: executing-plans
description: Execute tasks in controlled batches using subagents.
version: 1.0.0
scope: superpowers
priority: high
---

# Executing Plans Skill

## Goal

Systematically complete tasks using subagents with checkpoints.

## Instructions

1. For each task:
   - Launch subagent
   - Validate against plan
   - Commit on success
2. Report status after each batch.

## Output

- Task execution log and status.
