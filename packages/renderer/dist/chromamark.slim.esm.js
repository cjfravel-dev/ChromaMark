var U=`/*
 * ChromaMark theme \u2014 maps semantic tones to real colors and styles every
 * rendered construct. Tones are theme-owned: switch light/dark and colors
 * follow. Load alongside HTML produced by @chromamark/renderer.
 *
 * Theme resolution order: explicit [data-theme] wins; otherwise the reader's
 * prefers-color-scheme is honored.
 */

:root {
  --cm-success-fg:#1a7f37; --cm-success-bg:#dafbe1; --cm-success-bd:#2da44e;
  --cm-danger-fg:#cf222e;  --cm-danger-bg:#ffebe9;  --cm-danger-bd:#ff8182;
  --cm-warning-fg:#9a6700; --cm-warning-bg:#fff8c5; --cm-warning-bd:#d4a72c;
  --cm-info-fg:#0969da;    --cm-info-bg:#ddf4ff;    --cm-info-bd:#54aeff;
  --cm-tip-fg:#0f7b6c;     --cm-tip-bg:#d3f5f0;     --cm-tip-bd:#3bc4b0;
  --cm-muted-fg:#656d76;   --cm-muted-bg:#f6f8fa;   --cm-muted-bd:#d0d7de;
  --cm-neutral-bg:#f6f8fa; --cm-neutral-bd:#d0d7de;
  --cm-content-fg:#1f2328;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --cm-success-fg:#3fb950; --cm-success-bg:#12261e; --cm-success-bd:#238636;
    --cm-danger-fg:#f85149;  --cm-danger-bg:#25171c;  --cm-danger-bd:#da3633;
    --cm-warning-fg:#d29922; --cm-warning-bg:#272115; --cm-warning-bd:#9e6a03;
    --cm-info-fg:#58a6ff;    --cm-info-bg:#0d2233;    --cm-info-bd:#1f6feb;
    --cm-tip-fg:#56d4c3;     --cm-tip-bg:#0c2620;     --cm-tip-bd:#1c6f63;
    --cm-muted-fg:#8b949e;   --cm-muted-bg:#161b22;   --cm-muted-bd:#30363d;
    --cm-neutral-bg:#161b22; --cm-neutral-bd:#30363d;
    --cm-content-fg:#e6edf3;
  }
}

[data-theme="dark"] {
  --cm-success-fg:#3fb950; --cm-success-bg:#12261e; --cm-success-bd:#238636;
  --cm-danger-fg:#f85149;  --cm-danger-bg:#25171c;  --cm-danger-bd:#da3633;
  --cm-warning-fg:#d29922; --cm-warning-bg:#272115; --cm-warning-bd:#9e6a03;
  --cm-info-fg:#58a6ff;    --cm-info-bg:#0d2233;    --cm-info-bd:#1f6feb;
  --cm-tip-fg:#56d4c3;     --cm-tip-bg:#0c2620;     --cm-tip-bd:#1c6f63;
  --cm-muted-fg:#8b949e;   --cm-muted-bg:#161b22;   --cm-muted-bd:#30363d;
  --cm-neutral-bg:#161b22; --cm-neutral-bd:#30363d;
  --cm-content-fg:#e6edf3;
}

/* Map a tone onto the generic --fg/--bg/--bd consumed by every component. */
[data-tone="success"]{--fg:var(--cm-success-fg);--bg:var(--cm-success-bg);--bd:var(--cm-success-bd);}
[data-tone="danger"] {--fg:var(--cm-danger-fg); --bg:var(--cm-danger-bg); --bd:var(--cm-danger-bd);}
[data-tone="warning"]{--fg:var(--cm-warning-fg);--bg:var(--cm-warning-bg);--bd:var(--cm-warning-bd);}
[data-tone="info"]   {--fg:var(--cm-info-fg);   --bg:var(--cm-info-bg);   --bd:var(--cm-info-bd);}
[data-tone="tip"]    {--fg:var(--cm-tip-fg);    --bg:var(--cm-tip-bg);    --bd:var(--cm-tip-bd);}
[data-tone="muted"]  {--fg:var(--cm-muted-fg);  --bg:var(--cm-muted-bg);  --bd:var(--cm-muted-bd);}

/* Custom color (color=\u2026): derive a tinted bg/border from the chosen --fg. */
.cm-custom {
  --bg:transparent;
  --bd:currentColor;
}
@supports (color:color-mix(in srgb, red, blue)) {
  .cm-custom {
    --bg:color-mix(in srgb, var(--fg) 12%, transparent);
    --bd:color-mix(in srgb, var(--fg) 45%, transparent);
  }
}

/* ---- Colored block / callout ---- */
.cm-block {
  border:1px solid var(--bd, var(--cm-neutral-bd)); border-left-width:4px;
  background:var(--bg, var(--cm-neutral-bg));
  color:var(--cm-content-fg, inherit);
  border-radius:8px; padding:10px 14px; margin:12px 0;
}
.cm-block > .cm-title { font-weight:700; color:var(--fg, inherit); }
.cm-block > .cm-body > :first-child { margin-top:0; }
.cm-block > .cm-body > :last-child { margin-bottom:0; }

/* ---- Pill / badge ---- */
.cm-pill {
  display:inline-block; color:var(--fg); background:var(--bg); border:1px solid var(--bd);
  border-radius:999px; padding:0 .55em; font-size:.82em; font-weight:600; line-height:1.7;
  white-space:nowrap;
}

/* ---- Inline colored text (tint, no fill) ---- */
.cm-text { color:var(--fg); font-weight:600; }

/* ---- Progress meter ---- */
.cm-meter { display:inline-flex; align-items:center; gap:8px; vertical-align:middle; }
.cm-meter .cm-track {
  width:120px; height:8px; border-radius:999px; background:var(--cm-neutral-bg);
  border:1px solid var(--cm-neutral-bd); overflow:hidden;
}
.cm-meter .cm-fill { display:block; height:100%; background:var(--fg, var(--cm-info-fg)); }
.cm-meter .cm-val { font-size:.82em; font-weight:600; color:var(--fg); }

/* ---- Fields (key/value) ---- */
.cm-fields {
  display:grid; grid-template-columns:auto 1fr; gap:4px 16px; margin:12px 0;
  border:1px solid var(--cm-neutral-bd); border-radius:8px; padding:12px 14px;
  background:var(--cm-neutral-bg);
  color:var(--cm-content-fg, inherit);
}
.cm-fields dt { font-weight:600; opacity:.75; }
.cm-fields dd { margin:0; }

/* ---- Collapsible ---- */
.cm-details { border:1px solid var(--bd); border-radius:8px; margin:12px 0; overflow:hidden;
  color:var(--cm-content-fg, inherit); }
.cm-details > summary {
  cursor:pointer; padding:8px 14px; font-weight:600; list-style:none; background:var(--cm-neutral-bg);
}
.cm-details[data-tone] > summary, .cm-details.cm-custom > summary { color:var(--fg); background:var(--bg); }
.cm-details > summary::-webkit-details-marker { display:none; }
.cm-details > summary::before {
  content:"\\25B8"; display:inline-block; margin-right:8px; transition:transform .15s ease;
}
.cm-details[open] > summary::before { transform:rotate(90deg); }
.cm-details > .cm-body { padding:10px 14px; }
.cm-details > .cm-body > :first-child { margin-top:0; }
.cm-details > .cm-body > :last-child { margin-bottom:0; }

/* ---- Inline diff (CriticMarkup) ---- */
.crit-add { background:var(--cm-success-bg); color:var(--cm-success-fg); text-decoration:none; border-radius:3px; padding:0 2px; }
.crit-del { background:var(--cm-danger-bg); color:var(--cm-danger-fg); text-decoration:line-through; border-radius:3px; padding:0 2px; }
.crit-mark { background:var(--cm-warning-bg); border-radius:3px; padding:0 2px; }
.crit-comment { color:var(--cm-muted-fg); font-style:italic; }
`;var A=["success","danger","warning","info","tip","muted"],z={ok:"success",pass:"success",error:"danger",fail:"danger",warn:"warning",note:"info",hint:"tip",skip:"muted"},ae=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,le=/^[a-zA-Z][a-zA-Z0-9]*$/;function S(t){return B(t)||le.test(t)}function v(t){if(typeof t!="string")return null;let n=t.toLowerCase();return A.includes(n)?n:Object.prototype.hasOwnProperty.call(z,n)?z[n]:null}function B(t){return typeof t=="string"&&ae.test(t)}function $(t){if(typeof t!="string"||t.length===0)return null;if(t.toLowerCase().startsWith("color=")){let e=t.slice(6);return S(e)?{tone:null,color:e}:null}if(B(t))return{tone:null,color:t};let n=v(t);return n?{tone:n,color:null}:null}var fe={"--cm-success-fg":"#1a7f37","--cm-success-bg":"#dafbe1","--cm-success-bd":"#2da44e","--cm-danger-fg":"#cf222e","--cm-danger-bg":"#ffebe9","--cm-danger-bd":"#ff8182","--cm-warning-fg":"#9a6700","--cm-warning-bg":"#fff8c5","--cm-warning-bd":"#d4a72c","--cm-info-fg":"#0969da","--cm-info-bg":"#ddf4ff","--cm-info-bd":"#54aeff","--cm-tip-fg":"#0f7b6c","--cm-tip-bg":"#d3f5f0","--cm-tip-bd":"#3bc4b0","--cm-muted-fg":"#656d76","--cm-muted-bg":"#f6f8fa","--cm-muted-bd":"#d0d7de","--cm-neutral-bg":"#f6f8fa","--cm-neutral-bd":"#d0d7de","--cm-content-fg":"#1f2328"},me={"--cm-success-fg":"#3fb950","--cm-success-bg":"#12261e","--cm-success-bd":"#238636","--cm-danger-fg":"#f85149","--cm-danger-bg":"#25171c","--cm-danger-bd":"#da3633","--cm-warning-fg":"#d29922","--cm-warning-bg":"#272115","--cm-warning-bd":"#9e6a03","--cm-info-fg":"#58a6ff","--cm-info-bg":"#0d2233","--cm-info-bd":"#1f6feb","--cm-tip-fg":"#56d4c3","--cm-tip-bg":"#0c2620","--cm-tip-bd":"#1c6f63","--cm-muted-fg":"#8b949e","--cm-muted-bg":"#161b22","--cm-muted-bd":"#30363d","--cm-neutral-bg":"#161b22","--cm-neutral-bd":"#30363d","--cm-content-fg":"#e6edf3"},de={"--cm-success-fg":"#047857","--cm-success-bg":"#d1fae5","--cm-success-bd":"#10b981","--cm-danger-fg":"#be123c","--cm-danger-bg":"#ffe4e6","--cm-danger-bd":"#fb7185","--cm-warning-fg":"#a16207","--cm-warning-bg":"#fef9c3","--cm-warning-bd":"#eab308","--cm-info-fg":"#0369a1","--cm-info-bg":"#e0f2fe","--cm-info-bd":"#38bdf8","--cm-tip-fg":"#0f766e","--cm-tip-bg":"#ccfbf1","--cm-tip-bd":"#2dd4bf","--cm-muted-fg":"#475569","--cm-muted-bg":"#f1f5f9","--cm-muted-bd":"#cbd5e1","--cm-neutral-bg":"#f8fafc","--cm-neutral-bd":"#cbd5e1","--cm-content-fg":"#0f172a"},ue={"--cm-success-fg":"#4d7c0f","--cm-success-bg":"#ecfccb","--cm-success-bd":"#84cc16","--cm-danger-fg":"#be123c","--cm-danger-bg":"#fff1f2","--cm-danger-bd":"#fb7185","--cm-warning-fg":"#c2410c","--cm-warning-bg":"#ffedd5","--cm-warning-bd":"#fb923c","--cm-info-fg":"#7e22ce","--cm-info-bg":"#f3e8ff","--cm-info-bd":"#c084fc","--cm-tip-fg":"#be185d","--cm-tip-bg":"#fce7f3","--cm-tip-bd":"#f472b6","--cm-muted-fg":"#6b7280","--cm-muted-bg":"#f9fafb","--cm-muted-bd":"#d1d5db","--cm-neutral-bg":"#fff7ed","--cm-neutral-bd":"#fed7aa","--cm-content-fg":"#431407"},ge={"--cm-success-fg":"#262626","--cm-success-bg":"#f5f5f5","--cm-success-bd":"#737373","--cm-danger-fg":"#171717","--cm-danger-bg":"#e5e5e5","--cm-danger-bd":"#525252","--cm-warning-fg":"#404040","--cm-warning-bg":"#fafafa","--cm-warning-bd":"#a3a3a3","--cm-info-fg":"#262626","--cm-info-bg":"#f5f5f5","--cm-info-bd":"#737373","--cm-tip-fg":"#404040","--cm-tip-bg":"#fafafa","--cm-tip-bd":"#a3a3a3","--cm-muted-fg":"#737373","--cm-muted-bg":"#fafafa","--cm-muted-bd":"#d4d4d4","--cm-neutral-bg":"#fafafa","--cm-neutral-bd":"#d4d4d4","--cm-content-fg":"#171717"};function y(t){return Object.freeze({...t})}var _=Object.freeze({"github-light":y(fe),"github-dark":y(me),ocean:y(de),sunset:y(ue),monochrome:y(ge)}),be={foreground:"fg",background:"bg",border:"bd"};function q(t,n){if(typeof t!="string"||!S(t))throw new Error(`unsafe theme color at ${n}`);return t}function M(t="github-light"){let n=typeof t=="string"?{preset:t}:t;if(!n||typeof n!="object"||Array.isArray(n))throw new TypeError("theme must be a preset name or configuration object");let e=n.preset||"github-light",c=_[e];if(!c)throw new Error(`unknown theme preset "${e}"`);let r={...c};for(let[o,i]of Object.entries(n.tones||{})){if(!A.includes(o))throw new Error(`unknown theme tone "${o}"`);for(let[s,a]of Object.entries(i||{})){let l=be[s];if(!l)throw new Error(`unknown theme slot "${s}"`);r[`--cm-${o}-${l}`]=q(a,`tones.${o}.${s}`)}}for(let[o,i]of Object.entries(n.neutral||{})){if(!["foreground","background","border"].includes(o))throw new Error(`unknown theme slot "${o}"`);let s=o==="foreground"?"--cm-content-fg":`--cm-neutral-${o==="background"?"bg":"bd"}`;r[s]=q(i,`neutral.${o}`)}return r}function G(t,n){let e=t&&t.documentElement?t.documentElement:t;if(!e||!e.style||typeof e.style.setProperty!="function")throw new TypeError("theme target must be a style-capable Element or Document");for(let[c,r]of Object.entries(M(n)))e.style.setProperty(c,r);return e}var pe=91,he={"!":"pill",".":"text","=":"meter"};function xe(t){return t.replace(/\\([\s\S])/g,"$1")}var W=/\s/;function we(t,n,e){let c=n;for(;c<e&&W.test(t[c]);)c++;let r=c;for(;r<e&&!W.test(t[r]);)r++;return r===c?null:{specToken:t.slice(c,r),restStart:r}}function ke(t){let n,e=t.match(/^(\d+(?:\.\d+)?)\s*%$/),c=t.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);if(e)n=parseFloat(e[1]);else if(c){let r=parseFloat(c[2]);if(r===0)return null;n=parseFloat(c[1])/r*100}else return null;return n=Math.max(0,Math.min(100,n)),String(+n.toFixed(2))}function K(t,n,e,c){let r=t[n];if(r!==void 0&&r.from<=c&&(r.at===-1||c<=r.at))return r.at;let o=t.src.indexOf(e,c);return t[n]={from:c,at:o},o}function ve(t,n,e){let c=0;for(let r=n-1;r>=e&&t.charCodeAt(r)===92;r--)c++;return(c&1)===1}function X(t,n,e,c,r,o){let i=K(t,n,e,c);for(;i!==-1&&i<o&&ve(t.src,i,r);)i=K(t,n,e,i+1);return i}function ye(t,n){let e=t.posMax,c=X(t,"_cmBr","]",n,n,e);if(c===-1||c>=e)return-1;let r=X(t,"_cmNl",`
`,n,n,e);return r!==-1&&r<c?-1:c}function $e(t){return function(e,c){let r=e.pos;if(e.src.charCodeAt(r)!==pe)return!1;let o=he[e.src[r+1]];if(!o||!t[o])return!1;let i=ye(e,r+2);if(i===-1)return!1;let s=e.src,a=we(s,r+2,i);if(!a)return!1;let l=$(a.specToken);if(!l)return!1;let f=xe(s.slice(a.restStart,i).trim()),b;if(o==="meter"){if(!f)return!1;let p=ke(f);if(p===null)return!1;c||(b=e.push("cm_meter","",0),b.meta={...l,value:f,width:p})}else if(o==="text"){if(!f)return!1;c||(b=e.push("cm_text","",0),b.meta={...l,label:f})}else{let p=f||(l.tone?a.specToken.toUpperCase():l.color);c||(b=e.push("cm_pill","",0),b.meta={...l,label:p})}return e.pos=i+1,!0}}function O(t,n){let e=t.color?" cm-custom":"",c=t.tone?` data-tone="${t.tone}"`:"",r=t.color?` style="--fg:${n(t.color)}"`:"";return{custom:e,tone:c,style:r}}function I(t,n){t.inline.ruler.before("link","cm_inline",$e(n));let e=t.utils.escapeHtml;t.renderer.rules.cm_pill=(c,r)=>{let{custom:o,tone:i,style:s}=O(c[r].meta,e);return`<span class="cm-pill${o}"${i}${s}>${e(c[r].meta.label)}</span>`},t.renderer.rules.cm_text=(c,r)=>{let{custom:o,tone:i,style:s}=O(c[r].meta,e);return`<span class="cm-text${o}"${i}${s}>${e(c[r].meta.label)}</span>`},t.renderer.rules.cm_meter=(c,r)=>{let o=c[r].meta,{custom:i,tone:s,style:a}=O(o,e),l=` role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.width}" aria-valuetext="${e(o.value)}"`;return`<span class="cm-meter${i}"${s}${a}${l}><span class="cm-track"><span class="cm-fill" style="width:${o.width}%"></span></span><span class="cm-val">${e(o.value)}</span></span>`}}var Ce={"++":{kind:"add",close:"++}"},"--":{kind:"del",close:"--}"},"~~":{kind:"sub",close:"~~}"},"==":{kind:"mark",close:"==}"},">>":{kind:"comment",close:"<<}"}};function Te(t,n,e){let c="_cmCritic"+n,r=t[c];if(r!==void 0&&r.from<=e&&(r.at===-1||e<=r.at))return r.at;let o=t.src.indexOf(n,e);return t[c]={from:e,at:o},o}function Ee(t,n){let e=t.pos,c=t.src;if(c.charCodeAt(e)!==123)return!1;let r=Ce[c.slice(e+1,e+3)];if(!r)return!1;let o=e+3,i=Te(t,r.close,o);if(i===-1||i+r.close.length>t.posMax)return!1;let s=c.slice(o,i);if(!n){let a=t.push("cm_critic","",0);if(r.kind==="sub"){let l=s.indexOf("~>");a.meta={kind:"sub",old:l===-1?s:s.slice(0,l),neu:l===-1?"":s.slice(l+2)}}else a.meta={kind:r.kind,content:s}}return t.pos=i+r.close.length,!0}function P(t){t.inline.ruler.before("emphasis","cm_critic",Ee);let n=t.utils.escapeHtml;t.renderer.rules.cm_critic=(e,c)=>{let r=e[c].meta;switch(r.kind){case"add":return`<ins class="crit-add">${n(r.content)}</ins>`;case"del":return`<del class="crit-del">${n(r.content)}</del>`;case"sub":return`<del class="crit-del">${n(r.old)}</del><ins class="crit-add">${n(r.neu)}</ins>`;case"mark":return`<mark class="crit-mark">${n(r.content)}</mark>`;case"comment":return`<span class="crit-comment">${n(r.content)}</span>`;default:return""}}}var L=58,Ae=3,Se=t=>t.charAt(0).toUpperCase()+t.slice(1);function _e(t){if(!t)return null;let n=t.split(/\s+/),e=n.shift().toLowerCase(),c,r=null,o=null,i=!1;if(e==="details")c="details";else{if(e==="fields")return{structure:"fields"};if(e==="block")c="callout";else{let a=v(e);if(!a)return null;c="callout",r=a}}for(;n.length;){let a=n[0],l=a.toLowerCase();if(c==="details"&&l==="open"){i=!0,n.shift();continue}if(l.startsWith("color=")){let f=$(a);if(f&&f.color){o=f.color,n.shift();continue}break}if(c==="details"&&r===null&&v(a)){r=v(a),n.shift();continue}break}let s=n.join(" ").trim();return c==="details"?{structure:c,tone:r,color:o,open:i,summary:s||"Details"}:{structure:c,tone:r,color:o,title:s||(r?Se(r):"")}}function Z(t,n,e){let c=0,r=n;for(;r<e&&t.charCodeAt(r)===L;)c++,r++;return c}function Me(t){return function(e,c,r,o){let i=e.bMarks[c]+e.tShift[c],s=e.eMarks[c];if(e.src.charCodeAt(i)!==L)return!1;let a=Z(e.src,i,s);if(a<Ae)return!1;let l=_e(e.src.slice(i+a,s).trim());if(!l||!t[l.structure])return!1;if(o)return!0;let f=c,b=!1,p=0,T=0;for(;f++,!(f>=r);){let m=e.bMarks[f]+e.tShift[f],d=e.eMarks[f],h=e.sCount[f]-e.blkIndent;if(p){if(h<4&&e.src.charCodeAt(m)===p){let g=m;for(;g<d&&e.src.charCodeAt(g)===p;)g++;if(g-m>=T){let x=g;for(;x<d&&(e.src.charCodeAt(x)===32||e.src.charCodeAt(x)===9);)x++;x>=d&&(p=0,T=0)}}continue}let u=e.src.charCodeAt(m);if(h<4&&(u===96||u===126)){let g=m;for(;g<d&&e.src.charCodeAt(g)===u;)g++;if(g-m>=3){let x=!0;if(u===96){for(let E=g;E<d;E++)if(e.src.charCodeAt(E)===96){x=!1;break}}if(x){p=u,T=g-m;continue}}}if(u!==L||h>=4)continue;let w=Z(e.src,m,d);if(w<a)continue;let k=m+w;for(;k<d&&(e.src.charCodeAt(k)===32||e.src.charCodeAt(k)===9);)k++;if(!(k<d)){b=!0;break}}let oe=e.parentType,ie=e.lineMax;if(e.parentType="chroma_container",e.lineMax=f,l.structure==="fields"){let m=[];for(let h=c+1;h<f;h++){let u=e.src.slice(e.bMarks[h]+e.tShift[h],e.eMarks[h]);if(!u.trim())continue;let w=u.indexOf(":");w===-1?m.push([u.trim(),""]):m.push([u.slice(0,w).trim(),u.slice(w+1).trim()])}let d=e.push("cm_fields","",0);d.meta={rows:m},d.map=[c,f]}else{let m=e.push("cm_container_open","div",1);m.meta=l,m.block=!0,m.map=[c,f],e.md.block.tokenize(e,c+1,f);let d=e.push("cm_container_close","div",-1);d.meta=l,d.block=!0}return e.parentType=oe,e.lineMax=ie,e.line=f+(b?1:0),!0}}function R(t,n){t.block.ruler.before("fence","cm_container",Me(n),{alt:["paragraph","reference","blockquote","list"]});let e=t.utils.escapeHtml;function c(r){let o=r.color?" cm-custom":"",i=r.color?` style="--fg:${e(r.color)}"`:"",s=!r.color&&r.tone?` data-tone="${r.tone}"`:"";return{custom:o,style:i,tone:s}}t.renderer.rules.cm_container_open=(r,o)=>{let i=r[o].meta,{custom:s,style:a,tone:l}=c(i);if(i.structure==="details"){let b=i.open?" open":"";return`<details class="cm-details${s}"${l}${a}${b}><summary>${t.renderInline(i.summary)}</summary><div class="cm-body">`}let f=`<div class="cm-block${s}"${l}${a}>`;return i.title&&(f+=`<div class="cm-title">${t.renderInline(i.title)}</div>`),f+'<div class="cm-body">'},t.renderer.rules.cm_container_close=(r,o)=>r[o].meta.structure==="details"?"</div></details>":"</div></div>",t.renderer.rules.cm_fields=(r,o)=>{let i='<dl class="cm-fields">';for(let[s,a]of r[o].meta.rows)i+=`<dt>${e(s)}</dt><dd>${t.renderInline(a)}</dd>`;return i+"</dl>"}}var Oe={container:!0,details:!0,fields:!0,pill:!0,text:!0,meter:!0,critic:!0};function N(t,n={}){let e={...Oe,...n};(e.pill||e.text||e.meter)&&I(t,{pill:e.pill,text:e.text,meter:e.meter}),e.critic&&P(t),(e.container||e.details||e.fields)&&R(t,{callout:e.container,details:e.details,fields:e.fields})}var V="chromamark-theme",C="data-chromamark-done",Y="data-chromamark-src",Ie="data-chromamark-error",Pe='script[type="text/chromamark"], template.chromamark, [data-chromamark], [data-chromamark-src], .chromamark',H=null,F="";function J(t){if(typeof t!="function")throw new TypeError("renderer must be a function");H=t}function Le(t,n){if(!t||typeof t.use!="function"||typeof t.render!="function")throw new TypeError("MarkdownIt instance must expose use() and render()");return t.use(N,n),J(e=>t.render(e)),t}function j(t){F=t||""}function D(t,n){if(!H)throw new Error("configureRenderer() must be called before rendering");return H(String(t!=null?t:""),n)}function Q(t){let n=t||(typeof document!="undefined"?document:null);if(!n||n.getElementById(V))return;let e=n.createElement("style");e.id=V,e.textContent=F,(n.head||n.documentElement).appendChild(e)}function Re(t){let n=t.replace(/\r/g,"").split(`
`);for(;n.length&&n[0].trim()==="";)n.shift();for(;n.length&&n[n.length-1].trim()==="";)n.pop();let e=null;for(let r of n){if(!r.trim())continue;let o=r.match(/^[ \t]*/)[0];if(e===null){e=o;continue}let i=0,s=Math.min(e.length,o.length);for(;i<s&&e[i]===o[i];)i++;if(e=e.slice(0,i),!e)break}let c=e?e.length:0;return n.map(r=>r.slice(c)).join(`
`)}function ee(t){return typeof t=="string"?document.querySelector(t):t}function Ne(t,n){return n==="template"&&t.content?t.content.textContent||"":t.textContent||""}function te(t,n){let e=ee(t);if(!e||e.hasAttribute(C))return null;if(e.hasAttribute(Y))return re(e,n);let c=e.ownerDocument||document,r=(e.tagName||"").toLowerCase(),o=D(Re(Ne(e,r)),n);if(e.setAttribute(C,""),r==="script"||r==="template"){let i=c.createElement("div");return i.className="chromamark-output",i.innerHTML=o,e.parentNode&&e.parentNode.insertBefore(i,e.nextSibling),i}return e.innerHTML=o,e.classList.add("chromamark-output"),e}function re(t,n){let e=ee(t);if(!e||e.hasAttribute(C))return Promise.resolve(null);let c=e.getAttribute(Y);if(!c)return Promise.resolve(null);e.setAttribute(C,"");let r=e.ownerDocument&&e.ownerDocument.defaultView,o=r&&r.fetch||(typeof fetch!="undefined"?fetch:null),i=s=>(e.setAttribute(Ie,s),null);return o?Promise.resolve().then(()=>o(c)).then(s=>{if(!s||!s.ok)throw new Error(`HTTP ${s?s.status:"?"}`);return s.text()}).then(s=>(e.innerHTML=D(s,n),e.classList.add("chromamark-output"),e)).catch(s=>i(`ChromaMark: failed to load ${c} (${s&&s.message||s})`)):Promise.resolve(i("ChromaMark: fetch is unavailable"))}function ne(t,n){return Array.from(document.querySelectorAll(t||Pe)).map(e=>te(e,n))}function He(t={}){return Q(),ne(t.selector,t)}var Fe={configureRenderer:J,configureMarkdownIt:Le,configureTheme:j,render:D,renderElement:te,renderAll:ne,renderSrc:re,injectTheme:Q,autoRender:He,applyTheme:G,resolveTheme:M,THEME_PRESETS:_,get theme(){return F}},ce=Fe;j(U);var nt=ce;export{Fe as ChromaMarkSlim,_ as THEME_PRESETS,G as applyTheme,He as autoRender,Le as configureMarkdownIt,J as configureRenderer,j as configureTheme,nt as default,Q as injectTheme,D as render,ne as renderAll,te as renderElement,re as renderSrc,M as resolveTheme,F as theme};
