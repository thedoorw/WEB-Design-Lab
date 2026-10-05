export const ALLOWED_MODULE_TYPES=new Set([
  'promo','introSplit','featuredEntry','entryStream',
  'richText','archiveList','spacer','pagination'
]);

export const ALLOWED_PAGE_IDS=['home','start','archive'];

export class BundleValidationError extends Error{
  constructor(errors){
    super('INVALID_BUNDLE');
    this.name='BundleValidationError';
    this.code='INVALID_BUNDLE';
    this.status=422;
    this.details=errors;
  }
}

export function validateBundle(bundle){
  const errors=[];

  if(!bundle || typeof bundle!=='object' || Array.isArray(bundle)){
    return ['bundle must be an object'];
  }

  const topKeys=Object.keys(bundle);
  for(const key of topKeys){
    if(!['site','pages','content'].includes(key)){
      errors.push(`unknown top-level key: ${key}`);
    }
  }

  if(!bundle.site || typeof bundle.site!=='object') errors.push('bundle.site is required');
  if(!bundle.site?.settings || typeof bundle.site.settings!=='object') errors.push('bundle.site.settings is required');

  if(!bundle.pages || typeof bundle.pages!=='object' || Array.isArray(bundle.pages)){
    errors.push('bundle.pages is required');
  }else{
    for(const pageId of Object.keys(bundle.pages)){
      if(!ALLOWED_PAGE_IDS.includes(pageId)){
        errors.push(`unknown page id: ${pageId}`);
      }
    }

    for(const pageId of ALLOWED_PAGE_IDS){
      const page=bundle.pages[pageId];
      if(!page){
        errors.push(`missing page: ${pageId}`);
        continue;
      }
      if(!Array.isArray(page.modules)){
        errors.push(`page ${pageId} modules must be an array`);
        continue;
      }
      for(const mod of page.modules){
        if(!mod || typeof mod!=='object'){
          errors.push(`page ${pageId} contains invalid module`);
          continue;
        }
        if(!ALLOWED_MODULE_TYPES.has(mod.type)){
          errors.push(`unknown module type: ${mod.type}`);
        }
      }
    }
  }

  if(!bundle.content || typeof bundle.content!=='object'){
    errors.push('bundle.content is required');
  }
  if(!Array.isArray(bundle.content?.projects?.items)){
    errors.push('bundle.content.projects.items must be an array');
  }

  return errors;
}

export function bundleToFiles(bundle){
  const errors=validateBundle(bundle);
  if(errors.length) throw new BundleValidationError(errors);

  return [
    {path:'site/config/site.json',content:JSON.stringify(bundle.site,null,2)+'\n'},
    {path:'site/config/content/projects.json',content:JSON.stringify(bundle.content.projects,null,2)+'\n'},
    ...ALLOWED_PAGE_IDS.map(pageId=>({
      path:`site/config/pages/${pageId}.json`,
      content:JSON.stringify(bundle.pages[pageId],null,2)+'\n'
    }))
  ];
}
