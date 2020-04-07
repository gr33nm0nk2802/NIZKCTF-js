import { Octokit } from "@octokit/rest";

const repoNameHandler = repoName => {
  const [owner, repo] = repoName.split("/");
  return { owner, repo };
};

export default class GitHub {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token
    });
  }

  async getUser() {
    const { data } = await this.octokit.request("/user");

    const username = data.login;
    const { name, avatar_url } = data;

    return { avatar_url, name, username };
  }

  async createFork(repoName) {
    const { owner, repo } = repoNameHandler(repoName);

    const { data } = await this.octokit.repos.createFork({ owner, repo });

    return { path: data.full_name };
  }

  async createOrUpdateFile(
    owner,
    repo,
    path,
    message,
    content,
    branch = "master",
    sha = undefined
  ) {
    const response = await this.octokit.repos.createOrUpdateFile({
      owner,
      repo,
      path,
      message,
      content,
      sha,
      branch
    });
    return response.data;
  }

  async createPullRequest(owner, repo, title, head, base = "master") {
    const response = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      head,
      base
    });
    return response.data;
  }

  async listPullRequests(owner, repo, username = null, state = "open") {
    const response = await this.octokit.pulls.list({
      owner,
      repo,
      head: username,
      state
    });

    return response.data;
  }

  async checkState(owner, repo, pull_number) {
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number
    });

    const { state, merged, title } = data;

    return { title, state: merged ? "merged" : state };
  }

  async mergePullRequest(owner, repo, pull_number) {
    const response = await this.octokit.pulls.merge({
      owner,
      repo,
      pull_number
    });
    return response.data;
  }

  async createBranch(owner, repo, ref, sha) {
    const response = await this.octokit.git.createRef({
      owner,
      repo,
      ref,
      sha
    });
    return response.data;
  }

  async listBranches(owner, repo) {
    const response = await this.octokit.repos.listBranches({
      owner,
      repo
    });
    return response.data;
  }

  async getRef(owner, repo, ref) {
    const response = await this.octokit.git.getRef({ owner, repo, ref });
    return response.data;
  }

  async updateRef(owner, repo, ref, sha) {
    const response = await this.octokit.git.updateRef({
      owner,
      repo,
      ref,
      sha
    });
    return response.data;
  }

  async getContents(owner, repo, path) {
    const response = await this.octokit.repos.getContents({
      owner,
      repo,
      path
    });
    return response.data;
  }
}
