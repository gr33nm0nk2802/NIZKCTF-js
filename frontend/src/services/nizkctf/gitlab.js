import { Gitlab } from "@gitbeaker/node";

export default class GitLab {
  constructor(token) {
    this.api = new Gitlab({
      oauthToken: token
    });
  }

  async getUser() {
    const response = await this.api.Users.current();
    const { avatar_url, name, username } = response;
    return { avatar_url, name, username };
  }

  async createFork(repo) {
    try {
      const response = await this.api.Projects.fork(repo);
      return { path: response[0].path_with_namespace };
    } catch (error) {
      const response = await this.api.Projects.forks(repo, { owned: true });
      return { path: response[0].id };
    }
  }

  async createOrUpdateFile(
    repo,
    path,
    message,
    content,
    branch = "master",
    sha = undefined
  ) {
    try {
      const response = await this.api.RepositoryFiles.edit(
        repo,
        path,
        branch,
        content,
        message,
        {
          last_commit_id: sha
        }
      );
      return { path: response.file_path };
    } catch (err) {
      const response = await this.api.RepositoryFiles.create(
        repo,
        path,
        branch,
        content,
        message
      );
      return { path: response.file_path };
    }
  }

  async createPullRequest(
    sourceRepo,
    sourceBranch,
    title,
    targetRepo,
    targetBranch
  ) {
    const { iid, diff_refs } = await this.api.MergeRequests.create(
      sourceRepo,
      sourceBranch,
      targetBranch,
      title,
      {
        target_project_id: targetRepo
      }
    );

    return {
      number: iid,
      base_sha: diff_refs.base_sha,
      head_sha: diff_refs.head_sha
    };
  }
  async listPullRequests(projectId, authorUsername, state) {
    const response = await this.api.MergeRequests.all({
      projectId,
      authorUsername,
      state
    });

    return response.map(({ iid, title, state, web_url }) => ({
      number: iid,
      title,
      state,
      url: web_url
    }));
  }

  async checkState(repo, number) {
    const { iid, title, state, web_url } = await this.api.MergeRequests.show(
      repo,
      number
    );

    return {
      number: iid,
      title,
      state,
      url: web_url
    };
  }

  async createBranch(repo, branch, sha) {
    const { name, commit } = await this.api.Branches.create(repo, branch, sha);
    return { name, url: commit.web_url };
  }

  async listBranches(repo) {
    const response = await this.api.Branches.all(repo);

    return response.map(({ name, commit }) => ({
      name,
      url: commit.web_url,
      sha: commit.id
    }));
  }

  // TODO
  async getRef(owner, repo, ref) {
    console.log(owner, repo, ref);
  }

  // TODO
  async updateRef(owner, repo, ref, sha) {
    console.log(owner, repo, ref, sha);
  }

  async getContents(repo) {
    const response = await this.api.Repositories.tree(repo);

    return response.map(({ id, name, type }) => ({ sha: id, name, type }));
  }

  async __deleteBranch(repo, branch) {
    return this.api.Branches.remove(repo, branch);
  }

  async __closePullRequest(repo, number) {
    return this.api.MergeRequests.remove(repo, number);
  }

  async updateFromUpstream(originRepo, upstreamRepo, upstreamBranch) {
    const originBranch = "master";
    const title = "Update from upstream";

    const { number, head_sha } = await this.createPullRequest(
      upstreamRepo,
      upstreamBranch,
      title,
      originRepo,
      originBranch
    );
    await this.__deleteBranch(originRepo, "upstream");

    await this.createBranch(originRepo, "upstream", head_sha);
    await this.__closePullRequest(originRepo, number);
  }
}
