// eslint-disable-next-line @typescript-eslint/no-var-requires
const github = require('@actions/github');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const core = require('@actions/core');

const MAIN_BRANCH = 'main';
const SPACE_PREFIX = 'MOB';
const TEAM_ID = '9015210430';
const API_KEY = process.env.CLICKUP_API_KEY;

/*
  This script is an action that listens to the pull request events
  and updates the status of the tasks in ClickUp based on the following rules:

  Action  | Target Branch   | New Status
  -------------------------------
  Open    | any             | in review
  merged  | master          | qa or completed (if "skip QA" checkbox is checked)
  merged  | other           | Do nothing
  closed  | any             | open
  draft   | any             | in progress

  The task IDs are extracted from the PR title using the format: MOB-{number}
 */
async function handlePullRequestAction() {
  const pullRequestData = github.context.payload.pull_request;

  const targetBranch = pullRequestData.base.ref;
  const isDraft = pullRequestData.draft;
  const isMerged = pullRequestData.merged;
  const isClosed = pullRequestData.state === 'closed' && !isMerged;

  console.log({ isDraft, isMerged, isClosed, targetBranch });
  if (isMerged && targetBranch !== MAIN_BRANCH) {
    console.log('PR is merged but not to main branch. No action needed.');
    return;
  }

  let newTaskStatus;
  if (isClosed) {
    newTaskStatus = 'open';
  } else if (isDraft) {
    newTaskStatus = 'in progress';
  } else if (isMerged && targetBranch === MAIN_BRANCH) {
    newTaskStatus = isSkipQAChecked(pullRequestData.body) ? 'completed' : 'qa';
  } else {
    newTaskStatus = 'in review';
  }

  const title = pullRequestData.title;
  const taskIds = getTaskIds(title);
  if (taskIds.length === 0) {
    console.log('No task IDs found in the PR title.');
    return;
  }
  const promises = taskIds.map(taskId =>
    setStatusToTask({ taskId, status: newTaskStatus })
  );
  await Promise.all(promises);
  console.log('All tasks updated successfully!');
}

async function setStatusToTask({ taskId, status }) {
  const query = new URLSearchParams({
    custom_task_ids: 'true',
    team_id: TEAM_ID
  }).toString();

  const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}?${query}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_KEY
    },
    body: JSON.stringify({ status })
  });

  const data = await response.json();
  if (!response.ok) {
    console.log(`Failed to update task: ${taskId}`, data);
    return;
  }

  console.log(`Task ${taskId} updated to ${status}`);
}

/**
 * Extracts task IDs from a given string
 *
 * @param title the PR title
 * @returns {Array<string>}
 */
function getTaskIds(title) {
  const regex = new RegExp(`${SPACE_PREFIX}-(\\d+)`, 'g');
  const matches = title.match(regex);
  return matches ? [...new Set(matches)] : []; // Use Set for unique elements
}

/**
 * Check if the "skip QA" checkbox is checked in the PR description
 *
 * @param prDescription
 * @returns {boolean}
 */
function isSkipQAChecked(prDescription) {
  const checkboxRegex = /\[x]\s*skip\s*QA\s*/i;
  const checkboxMatch = checkboxRegex.exec(prDescription);
  return checkboxMatch !== null;
}

handlePullRequestAction().catch(e => core.setFailed(e));
