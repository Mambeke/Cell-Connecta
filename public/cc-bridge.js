'use strict';
// Existing product/admin application: return to the new homepage with a full navigation.
document.addEventListener('click',function(e){const a=e.target.closest('a[href]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||a.target==='_blank')return;const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname==='/'&&location.pathname!=='/'){e.preventDefault();e.stopImmediatePropagation();location.assign(u.href);}},true);
for(const name of ['pushState','replaceState']){const original=history[name];history[name]=function(state,unused,url){if(url){const target=new URL(url,location.href);if(target.origin===location.origin&&target.pathname==='/'&&location.pathname!=='/'){location.assign(target.href);return;}}return original.apply(this,arguments);};}
window.addEventListener('popstate',()=>{if(location.pathname==='/')location.reload();});
