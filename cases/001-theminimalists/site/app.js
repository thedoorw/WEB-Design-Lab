const toggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('.nav');
if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded',String(open));
  });
}
document.querySelectorAll('.signup').forEach(form=>{
  form.addEventListener('submit',e=>e.preventDefault());
});
