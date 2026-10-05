const root = document.documentElement.dataset.siteRoot || './';
const pageId = document.documentElement.dataset.page || 'home';
const app = document.querySelector('#app');

const join = (path) => `${root}${path}`;

async function getJSON(path){
  const res = await fetch(join(path), {cache:'no-store'});
  if(!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function el(tag, className, text){
  const node=document.createElement(tag);
  if(className) node.className=className;
  if(text !== undefined) node.textContent=text;
  return node;
}

function link(label, href, className){
  const a=el('a',className,label);
  a.href = href.startsWith('#') || href.startsWith('http') ? href : join(href);
  return a;
}

function px(value){ return typeof value === 'number' ? `${value}px` : value; }

function applySettings(siteSettings, pageSettings = {}){
  const merged={
    ...siteSettings,
    ...pageSettings,
    colors:{...(siteSettings.colors||{}),...(pageSettings.colors||{})},
    type:{...(siteSettings.type||{}),...(pageSettings.type||{})},
    rhythm:{...(siteSettings.rhythm||{}),...(pageSettings.rhythm||{})}
  };

  const vars={
    '--content-width':px(merged.contentWidth),
    '--mobile-width':px(merged.mobileWidth),
    '--breakpoint':px(merged.breakpoint),
    '--page':merged.colors?.page,
    '--ink':merged.colors?.ink,
    '--muted':merged.colors?.muted,
    '--line':merged.colors?.line,
    '--soft':merged.colors?.soft,
    '--body-size':px(merged.type?.bodyPx),
    '--display-size':px(merged.type?.displayPx),
    '--entry-title-size':px(merged.type?.entryTitlePx),
    '--mobile-entry-title-size':px(merged.type?.mobileEntryTitlePx),
    '--entry-gap':px(merged.rhythm?.entryGapPx),
    '--mobile-entry-gap':px(merged.rhythm?.mobileEntryGapPx)
  };

  for(const [key,value] of Object.entries(vars)){
    if(value !== undefined) document.documentElement.style.setProperty(key,value);
  }
  return merged;
}

function media(label, className='media-placeholder'){
  return el('div',className,label || 'Media');
}

function projectMap(content){
  return new Map((content.items || []).map(item => [item.id,item]));
}

function renderHeader(site){
  const header=el('header','site-header');
  const masthead=el('div','masthead shell');
  masthead.append(
    link(site.identity.name,'','brand'),
    el('p','tagline',site.identity.tagline)
  );

  const navBar=el('div','nav-bar');
  const row=el('div','shell nav-row');
  const toggle=el('button','nav-toggle','Menu');
  toggle.type='button';
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-controls','site-nav');

  const nav=el('nav','nav');
  nav.id='site-nav';
  nav.setAttribute('aria-label','Primary');
  for(const item of site.shell.navigation || []){
    nav.append(link(item.label,item.href));
  }
  row.append(toggle,nav);
  navBar.append(row);
  header.append(masthead,navBar);

  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded',String(open));
  });
  return header;
}

function renderFooter(site){
  const footer=el('footer','site-footer');
  const row=el('div','shell footer-row');
  row.append(
    el('span','',site.shell.footer?.left || ''),
    el('span','',site.shell.footer?.right || '')
  );
  footer.append(row);
  return footer;
}

function projectEntry(project, featured=false){
  const article=el('article',featured ? 'entry featured' : 'entry split');
  const text=el('div','entry-copy');
  const heading=el(featured ? 'h1' : 'h2');
  heading.append(link(project.title,'#'));
  text.append(heading);

  if(featured){
    text.append(el('p','meta',`${project.kind} · ${project.year}`));
    article.append(text,media(project.mediaLabel,'media-placeholder featured-media'));
    article.append(el('p','entry-summary',project.summary),link('More +','#','more'));
  } else {
    text.append(el('p','entry-summary',project.summary),link('More +','#','more'));
    article.append(text,media(project.mediaLabel,'media-placeholder thumb'));
  }
  return article;
}

const modules={
  promo(def){
    return el('div','promo',def.text || '');
  },

  introSplit(def){
    const section=el('section','intro shell');
    section.append(
      media(def.mediaLabel,'intro-media media-placeholder'),
      el('div','intro-copy')
    );
    section.querySelector('.intro-copy').append(el('p','',def.text || ''));
    return section;
  },

  featuredEntry(def,ctx){
    const p=ctx.projects.get(def.projectId);
    return p ? projectEntry(p,true) : el('div','module-error',`Missing project: ${def.projectId}`);
  },

  entryStream(def,ctx){
    const wrap=el('section','entry-stream');
    for(const id of def.projectIds || []){
      const p=ctx.projects.get(id);
      if(p) wrap.append(projectEntry(p,false));
    }
    return wrap;
  },

  richText(def){
    const section=el('section','rich-text');
    if(def.heading) section.append(el('h1','',def.heading));
    for(const block of def.blocks || []){
      if(block.type === 'h2') section.append(el('h2','',block.text));
      else section.append(el('p','',block.text));
    }
    return section;
  },

  archiveList(def,ctx){
    const section=el('section','archive-list');
    if(def.heading) section.append(el('h1','',def.heading));
    const ul=el('ul','index-list');
    for(const id of def.projectIds || []){
      const p=ctx.projects.get(id);
      if(!p) continue;
      const li=el('li');
      li.append(link(p.title,'#'),el('span','archive-meta',`${p.kind} · ${p.year}`));
      ul.append(li);
    }
    section.append(ul);
    return section;
  },

  spacer(def){
    return el('div',`spacer spacer-${def.size || 'medium'}`);
  },

  pagination(def){
    const nav=el('nav','pagination');
    nav.setAttribute('aria-label','Pagination');
    nav.append(el('span','',def.current || ''),link(def.nextLabel || 'Next',def.nextHref || '#'));
    return nav;
  }
};

function renderPage(page,ctx){
  const fragment=document.createDocumentFragment();
  fragment.append(renderHeader(ctx.site));

  const main=el('main','reading');
  for(const def of page.modules || []){
    const renderer=modules[def.type];
    if(!renderer){
      main.append(el('div','module-error',`Unknown module: ${def.type}`));
      continue;
    }
    const rendered=renderer(def,ctx);
    if(def.type === 'promo' || def.type === 'introSplit'){
      fragment.append(rendered);
    } else {
      main.append(rendered);
    }
  }
  fragment.append(main,renderFooter(ctx.site));
  return fragment;
}

async function boot(){
  try{
    const site=await getJSON('config/site.json');
    const pagePath=site.pages?.[pageId];
    if(!pagePath) throw new Error(`Unknown page id: ${pageId}`);
    const [page,projectsData]=await Promise.all([
      getJSON(pagePath),
      getJSON(site.content.projects)
    ]);

    document.title = page.title || site.identity.name;
    const settings=applySettings(site.settings,page.settings);
    document.documentElement.dataset.contentWidth=String(settings.contentWidth);

    app.replaceChildren(renderPage(page,{
      site,
      page,
      projects:projectMap(projectsData),
      settings
    }));
  }catch(error){
    console.error(error);
    app.replaceChildren(el('pre','boot-error',String(error)));
    document.documentElement.dataset.bootError='true';
  }
}

boot();
