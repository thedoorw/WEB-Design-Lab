export class GitHubAdapterError extends Error{
  constructor(message,{status=500,code='GITHUB_ADAPTER_ERROR',details=null}={}){
    super(message);
    this.name='GitHubAdapterError';
    this.status=status;
    this.code=code;
    this.details=details;
  }
}

function apiUrl(owner,repo,path=''){
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path}`;
}

async function gh(token,url,options={},fetchImpl=fetch){
  const response=await fetchImpl(url,{
    ...options,
    headers:{
      'Accept':'application/vnd.github+json',
      'Authorization':`Bearer ${token}`,
      'X-GitHub-Api-Version':'2022-11-28',
      ...(options.body ? {'Content-Type':'application/json'} : {}),
      ...(options.headers||{})
    }
  });

  let body=null;
  try{ body=await response.json(); }
  catch{ body=null; }

  if(!response.ok){
    throw new GitHubAdapterError(
      body?.message || `GitHub HTTP ${response.status}`,
      {
        status:response.status,
        code:'GITHUB_HTTP_ERROR',
        details:body
      }
    );
  }
  return body;
}

export async function getRepoHead({token,owner,repo,branch,fetchImpl=fetch}){
  const ref=await gh(
    token,
    apiUrl(owner,repo,`/git/ref/heads/${encodeURIComponent(branch)}`),
    {},
    fetchImpl
  );
  return ref?.object?.sha;
}

export async function atomicCommit({
  token,
  owner,
  repo,
  branch,
  message,
  files,
  baseRevision=null,
  fetchImpl=fetch
}){
  if(!Array.isArray(files) || !files.length){
    throw new GitHubAdapterError('No files to commit',{
      status:422,
      code:'NO_FILES'
    });
  }

  const currentHead=await getRepoHead({token,owner,repo,branch,fetchImpl});
  if(!currentHead){
    throw new GitHubAdapterError('Unable to resolve repository HEAD',{
      status:502,
      code:'HEAD_NOT_FOUND'
    });
  }

  if(baseRevision && baseRevision!==currentHead){
    throw new GitHubAdapterError('Repository changed since the editor loaded',{
      status:409,
      code:'BASE_REVISION_CONFLICT',
      details:{currentHead}
    });
  }

  const currentCommit=await gh(
    token,
    apiUrl(owner,repo,`/git/commits/${currentHead}`),
    {},
    fetchImpl
  );

  const baseTree=currentCommit?.tree?.sha;
  if(!baseTree){
    throw new GitHubAdapterError('Unable to resolve base tree',{
      status:502,
      code:'BASE_TREE_NOT_FOUND'
    });
  }

  const tree=await gh(
    token,
    apiUrl(owner,repo,'/git/trees'),
    {
      method:'POST',
      body:JSON.stringify({
        base_tree:baseTree,
        tree:files.map(file=>({
          path:file.path,
          mode:'100644',
          type:'blob',
          content:file.content
        }))
      })
    },
    fetchImpl
  );

  const commit=await gh(
    token,
    apiUrl(owner,repo,'/git/commits'),
    {
      method:'POST',
      body:JSON.stringify({
        message:message || 'Update site content',
        tree:tree.sha,
        parents:[currentHead]
      })
    },
    fetchImpl
  );

  await gh(
    token,
    apiUrl(owner,repo,`/git/refs/heads/${encodeURIComponent(branch)}`),
    {
      method:'PATCH',
      body:JSON.stringify({
        sha:commit.sha,
        force:false
      })
    },
    fetchImpl
  );

  return {
    commitSha:commit.sha,
    previousHead:currentHead,
    branch,
    changedFiles:files.map(file=>file.path)
  };
}

export async function getGitHubUser(token,fetchImpl=fetch){
  const response=await fetchImpl('https://api.github.com/user',{
    headers:{
      'Accept':'application/vnd.github+json',
      'Authorization':`Bearer ${token}`,
      'X-GitHub-Api-Version':'2022-11-28'
    }
  });
  const body=await response.json();
  if(!response.ok){
    throw new GitHubAdapterError(body?.message || 'Unable to read GitHub user',{
      status:response.status,
      code:'GITHUB_USER_ERROR',
      details:body
    });
  }
  return body;
}
