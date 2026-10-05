const DRAFT_KEY='webDesignLab.modularDraft.v0.1';
const CONFIG_ROOT='../config/';

const els={
  status:document.querySelector('#status'),
  pageSelect:document.querySelector('#page-select'),
  pageTitle:document.querySelector('#page-title'),
  pageWidthInherit:document.querySelector('#page-width-inherit'),
  pageWidth:document.querySelector('#page-width'),
  siteName:document.querySelector('#site-name'),
  siteTagline:document.querySelector('#site-tagline'),
  siteWidth:document.querySelector('#site-width'),
  mobileWidth:document.querySelector('#mobile-width'),
  displaySize:document.querySelector('#display-size'),
  entrySize:document.querySelector('#entry-size'),
  pageColor:document.querySelector('#page-color'),
  inkColor:document.querySelector('#ink-color'),
  moduleList:document.querySelector('#module-list'),
  moduleJson:document.querySelector('#module-json'),
  applyModuleJson:document.querySelector('#apply-module-json'),
  addModuleType:document.querySelector('#add-module-type'),
  addModule:document.querySelector('#add-module'),
  projectList:document.querySelector('#project-list'),
  addProject:document.querySelector('#add-project'),
  bundleSummary:document.querySelector('#bundle-summary'),
  preview:document.querySelector('#preview'),
  previewShell:document.querySelector('#preview-shell'),
  resetSource:document.querySelector('#reset-source'),
  exportBundle:document.querySelector('#export-bundle'),
  copyBundle:document.querySelector('#copy-bundle'),
  importBundle:document.querySelector('#import-bundle')
};

const moduleTypes=[
  'promo','introSplit','featuredEntry','entryStream',
  'richText','archiveList','spacer','pagination'
];

let sourceBundle=null;
let draft=null;
let currentPageId='home';
let selectedModuleIndex=0;
let dirty=false;
let dragIndex=null;

const deepClone=value=>JSON.parse(JSON.stringify(value));

async function getJSON(path){
  const res=await fetch(path,{cache:'no-store'});
  if(!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function loadSourceBundle(){
  const site=await getJSON(CONFIG_ROOT+'site.json');
  const pageEntries=await Promise.all(
    Object.entries(site.pages||{}).map(async ([id,path])=>[id,await getJSON('../'+path)])
  );
  const projects=await getJSON('../'+site.content.projects);
  return {
    site,
    pages:Object.fromEntries(pageEntries),
    content:{projects}
  };
}

function validDraft(value){
  return value &&
    value.site?.settings &&
    value.pages &&
    value.content?.projects?.items;
}

function restoreDraft(){
  try{
    const raw=sessionStorage.getItem(DRAFT_KEY);
    const parsed=raw ? JSON.parse(raw) : null;
    return validDraft(parsed) ? parsed : null;
  }catch{
    return null;
  }
}

function setStatus(text){
  els.status.textContent=text;
}

function markDirty(reason='Draft changed'){
  dirty=true;
  setStatus(reason+' · not written to GitHub');
}

function saveSession(){
  sessionStorage.setItem(DRAFT_KEY,JSON.stringify(draft));
}

function currentPage(){
  return draft.pages[currentPageId];
}

function projectIds(){
  return draft.content.projects.items.map(x=>x.id);
}

function defaultModule(type){
  const ids=projectIds();
  switch(type){
    case 'promo':
      return {type,text:'New promo text'};
    case 'introSplit':
      return {type,mediaLabel:'Intro media',text:'New introduction text.'};
    case 'featuredEntry':
      return {type,projectId:ids[0]||''};
    case 'entryStream':
      return {type,projectIds:ids.slice(0,3)};
    case 'richText':
      return {type,heading:'New section',blocks:[{type:'p',text:'New paragraph.'}]};
    case 'archiveList':
      return {type,heading:'Archive',projectIds:ids.slice()};
    case 'spacer':
      return {type,size:'medium'};
    case 'pagination':
      return {type,current:'1',nextLabel:'Next',nextHref:'#'};
    default:
      return {type};
  }
}

function moduleSummary(def){
  if(def.text) return def.text;
  if(def.heading) return def.heading;
  if(def.projectId) return def.projectId;
  if(def.projectIds) return def.projectIds.join(', ');
  if(def.nextLabel) return def.nextLabel;
  if(def.size) return def.size;
  return '';
}

function syncPreview(){
  saveSession();
  const message={type:'MODULAR_EDITOR_DRAFT',bundle:draft,pageId:currentPageId};
  if(els.preview.contentWindow){
    els.preview.contentWindow.postMessage(message,location.origin);
  }
  updateSummary();
}

function setPreviewPage(){
  const url=new URL('../',location.href);
  url.searchParams.set('preview','admin');
  url.searchParams.set('page',currentPageId);
  els.preview.src=url.toString();
}

function updateSummary(){
  const page=currentPage();
  const width=page.settings?.contentWidth ?? draft.site.settings.contentWidth;
  els.bundleSummary.textContent=[
    `Page: ${currentPageId}`,
    `Desktop width: ${width}px`,
    `Mobile width: ${draft.site.settings.mobileWidth}px`,
    `Modules: ${page.modules.length}`,
    `Projects: ${draft.content.projects.items.length}`,
    `Draft: ${dirty ? 'modified' : 'source/session'}`
  ].join('\n');
}

function renderPageOptions(){
  els.pageSelect.replaceChildren();
  for(const id of Object.keys(draft.pages)){
    const option=document.createElement('option');
    option.value=id;
    option.textContent=id;
    els.pageSelect.append(option);
  }
  if(!draft.pages[currentPageId]) currentPageId=Object.keys(draft.pages)[0];
  els.pageSelect.value=currentPageId;
}

function renderSettings(){
  const site=draft.site;
  const page=currentPage();
  els.siteName.value=site.identity.name||'';
  els.siteTagline.value=site.identity.tagline||'';
  els.siteWidth.value=site.settings.contentWidth;
  els.mobileWidth.value=site.settings.mobileWidth;
  els.displaySize.value=site.settings.type?.displayPx ?? 32;
  els.entrySize.value=site.settings.type?.entryTitlePx ?? 24;
  els.pageColor.value=site.settings.colors?.page || '#ffffff';
  els.inkColor.value=site.settings.colors?.ink || '#171717';

  els.pageTitle.value=page.title||'';
  const hasOverride=page.settings && Object.hasOwn(page.settings,'contentWidth');
  els.pageWidthInherit.checked=!hasOverride;
  els.pageWidth.disabled=!hasOverride;
  els.pageWidth.value=hasOverride ? page.settings.contentWidth : site.settings.contentWidth;
}

function renderModules(){
  const modules=currentPage().modules;
  if(selectedModuleIndex>=modules.length) selectedModuleIndex=Math.max(0,modules.length-1);

  els.moduleList.replaceChildren();
  modules.forEach((def,index)=>{
    const item=document.createElement('div');
    item.className='module-item'+(index===selectedModuleIndex?' selected':'');
    item.draggable=true;
    item.dataset.index=String(index);

    const main=document.createElement('div');
    main.className='module-main';
    const type=document.createElement('span');
    type.className='module-type';
    type.textContent=`${index+1}. ${def.type}`;
    const detail=document.createElement('span');
    detail.className='module-detail';
    detail.textContent=moduleSummary(def);
    main.append(type,detail);
    main.addEventListener('click',()=>{
      selectedModuleIndex=index;
      renderModules();
    });

    const actions=document.createElement('div');
    actions.className='module-actions';

    const up=document.createElement('button');
    up.type='button'; up.textContent='↑'; up.title='Move up';
    up.disabled=index===0;
    up.addEventListener('click',()=>moveModule(index,index-1));

    const down=document.createElement('button');
    down.type='button'; down.textContent='↓'; down.title='Move down';
    down.disabled=index===modules.length-1;
    down.addEventListener('click',()=>moveModule(index,index+1));

    const del=document.createElement('button');
    del.type='button'; del.textContent='×'; del.title='Delete module';
    del.addEventListener('click',()=>{
      modules.splice(index,1);
      selectedModuleIndex=Math.min(index,modules.length-1);
      markDirty('Module deleted');
      renderModules();
      syncPreview();
    });

    actions.append(up,down,del);
    item.append(main,actions);

    item.addEventListener('dragstart',()=>{
      dragIndex=index;
      item.classList.add('dragging');
    });
    item.addEventListener('dragend',()=>{
      dragIndex=null;
      item.classList.remove('dragging');
      document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
    });
    item.addEventListener('dragover',event=>{
      event.preventDefault();
      item.classList.add('drop-target');
    });
    item.addEventListener('dragleave',()=>item.classList.remove('drop-target'));
    item.addEventListener('drop',event=>{
      event.preventDefault();
      item.classList.remove('drop-target');
      if(dragIndex===null || dragIndex===index) return;
      moveModule(dragIndex,index);
    });

    els.moduleList.append(item);
  });

  const selected=modules[selectedModuleIndex];
  els.moduleJson.value=selected ? JSON.stringify(selected,null,2) : '';
  els.moduleJson.disabled=!selected;
  els.applyModuleJson.disabled=!selected;
}

function moveModule(from,to){
  const modules=currentPage().modules;
  if(to<0 || to>=modules.length || from===to) return;
  const [item]=modules.splice(from,1);
  modules.splice(to,0,item);
  selectedModuleIndex=to;
  markDirty('Module order changed');
  renderModules();
  syncPreview();
}

function renderProjects(){
  els.projectList.replaceChildren();
  draft.content.projects.items.forEach((project,index)=>{
    const card=document.createElement('div');
    card.className='project-card';

    const head=document.createElement('div');
    head.className='project-head';
    const id=document.createElement('span');
    id.className='project-id';
    id.textContent=project.id;

    const del=document.createElement('button');
    del.type='button';
    del.textContent='Delete';
    del.addEventListener('click',()=>{
      draft.content.projects.items.splice(index,1);
      markDirty('Project deleted');
      renderProjects();
      renderModules();
      syncPreview();
    });
    head.append(id,del);

    const fields=[
      ['Title','title','text'],
      ['Kind','kind','text'],
      ['Year','year','text'],
      ['Media label','mediaLabel','text']
    ];

    card.append(head);
    for(const [label,key,type] of fields){
      const wrapper=document.createElement('label');
      wrapper.textContent=label;
      const input=document.createElement('input');
      input.type=type;
      input.value=project[key]||'';
      input.addEventListener('input',()=>{
        project[key]=input.value;
        markDirty('Content changed');
        syncPreview();
        renderModules();
      });
      wrapper.append(input);
      card.append(wrapper);
    }

    const summary=document.createElement('label');
    summary.textContent='Summary';
    const textarea=document.createElement('textarea');
    textarea.value=project.summary||'';
    textarea.addEventListener('input',()=>{
      project.summary=textarea.value;
      markDirty('Content changed');
      syncPreview();
    });
    summary.append(textarea);
    card.append(summary);

    els.projectList.append(card);
  });
}

function renderAll(){
  renderPageOptions();
  renderSettings();
  renderModules();
  renderProjects();
  updateSummary();
}

function bindSimpleInputs(){
  els.siteName.addEventListener('input',()=>{
    draft.site.identity.name=els.siteName.value;
    markDirty('Site identity changed'); syncPreview();
  });

  els.siteTagline.addEventListener('input',()=>{
    draft.site.identity.tagline=els.siteTagline.value;
    markDirty('Site identity changed'); syncPreview();
  });

  els.siteWidth.addEventListener('input',()=>{
    draft.site.settings.contentWidth=Number(els.siteWidth.value);
    if(els.pageWidthInherit.checked) els.pageWidth.value=els.siteWidth.value;
    markDirty('Site width changed'); syncPreview();
  });

  els.mobileWidth.addEventListener('input',()=>{
    draft.site.settings.mobileWidth=Number(els.mobileWidth.value);
    markDirty('Mobile width changed'); syncPreview();
  });

  els.displaySize.addEventListener('input',()=>{
    draft.site.settings.type.displayPx=Number(els.displaySize.value);
    markDirty('Typography changed'); syncPreview();
  });

  els.entrySize.addEventListener('input',()=>{
    draft.site.settings.type.entryTitlePx=Number(els.entrySize.value);
    markDirty('Typography changed'); syncPreview();
  });

  els.pageColor.addEventListener('input',()=>{
    draft.site.settings.colors.page=els.pageColor.value;
    markDirty('Color changed'); syncPreview();
  });

  els.inkColor.addEventListener('input',()=>{
    draft.site.settings.colors.ink=els.inkColor.value;
    markDirty('Color changed'); syncPreview();
  });

  els.pageTitle.addEventListener('input',()=>{
    currentPage().title=els.pageTitle.value;
    markDirty('Page title changed'); syncPreview();
  });

  els.pageWidthInherit.addEventListener('change',()=>{
    currentPage().settings ||= {};
    if(els.pageWidthInherit.checked){
      delete currentPage().settings.contentWidth;
      els.pageWidth.disabled=true;
      els.pageWidth.value=draft.site.settings.contentWidth;
    }else{
      currentPage().settings.contentWidth=Number(els.pageWidth.value||draft.site.settings.contentWidth);
      els.pageWidth.disabled=false;
    }
    markDirty('Page width rule changed'); syncPreview();
  });

  els.pageWidth.addEventListener('input',()=>{
    if(els.pageWidthInherit.checked) return;
    currentPage().settings ||= {};
    currentPage().settings.contentWidth=Number(els.pageWidth.value);
    markDirty('Page width changed'); syncPreview();
  });
}

function download(name,text){
  const blob=new Blob([text],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),500);
}

async function init(){
  try{
    setStatus('Loading source…');
    sourceBundle=await loadSourceBundle();
    draft=restoreDraft() || deepClone(sourceBundle);

    for(const type of moduleTypes){
      const option=document.createElement('option');
      option.value=type;
      option.textContent=type;
      els.addModuleType.append(option);
    }

    renderAll();
    bindSimpleInputs();

    els.pageSelect.addEventListener('change',()=>{
      currentPageId=els.pageSelect.value;
      selectedModuleIndex=0;
      renderSettings();
      renderModules();
      setPreviewPage();
      updateSummary();
    });

    els.addModule.addEventListener('click',()=>{
      const module=defaultModule(els.addModuleType.value);
      currentPage().modules.push(module);
      selectedModuleIndex=currentPage().modules.length-1;
      markDirty('Module added');
      renderModules();
      syncPreview();
    });

    els.applyModuleJson.addEventListener('click',()=>{
      try{
        const next=JSON.parse(els.moduleJson.value);
        if(!next.type) throw new Error('Module requires a type');
        currentPage().modules[selectedModuleIndex]=next;
        markDirty('Module JSON changed');
        renderModules();
        syncPreview();
      }catch(error){
        alert(String(error));
      }
    });

    els.addProject.addEventListener('click',()=>{
      const used=new Set(projectIds());
      let n=1;
      while(used.has(`p${String(n).padStart(3,'0')}`)) n++;
      draft.content.projects.items.push({
        id:`p${String(n).padStart(3,'0')}`,
        title:'New Project',
        kind:'Project',
        year:String(new Date().getFullYear()),
        summary:'New project summary.',
        mediaLabel:'Project media'
      });
      markDirty('Project added');
      renderProjects();
      syncPreview();
    });

    els.resetSource.addEventListener('click',()=>{
      if(!confirm('Discard the current draft and reload repository source data?')) return;
      draft=deepClone(sourceBundle);
      dirty=false;
      currentPageId='home';
      selectedModuleIndex=0;
      saveSession();
      renderAll();
      setPreviewPage();
      setStatus('Reset to repository source · not written to GitHub');
    });

    els.exportBundle.addEventListener('click',()=>{
      download('modular-site-draft.json',JSON.stringify(draft,null,2));
      setStatus('Draft bundle exported');
    });

    els.copyBundle.addEventListener('click',async()=>{
      await navigator.clipboard.writeText(JSON.stringify(draft,null,2));
      setStatus('Draft bundle copied to clipboard');
    });

    els.importBundle.addEventListener('change',async()=>{
      const file=els.importBundle.files?.[0];
      if(!file) return;
      try{
        const parsed=JSON.parse(await file.text());
        if(!validDraft(parsed)) throw new Error('Bundle shape is invalid');
        draft=parsed;
        dirty=true;
        currentPageId=Object.keys(draft.pages)[0]||'home';
        selectedModuleIndex=0;
        renderAll();
        saveSession();
        setPreviewPage();
        setStatus('Imported bundle · not written to GitHub');
      }catch(error){
        alert(String(error));
      }finally{
        els.importBundle.value='';
      }
    });

    document.querySelectorAll('[data-width]').forEach(button=>{
      button.addEventListener('click',()=>{
        document.querySelectorAll('[data-width]').forEach(x=>x.classList.remove('active'));
        button.classList.add('active');
        els.previewShell.style.setProperty('--preview-width',button.dataset.width+'px');
      });
    });

    els.preview.addEventListener('load',()=>{
      syncPreview();
    });

    saveSession();
    setPreviewPage();
    setStatus(restoreDraft() ? 'Session draft loaded · not written to GitHub' : 'Source loaded · not written to GitHub');
  }catch(error){
    console.error(error);
    setStatus('Editor failed to load');
    document.body.insertAdjacentHTML('beforeend',`<pre>${String(error)}</pre>`);
  }
}

init();
