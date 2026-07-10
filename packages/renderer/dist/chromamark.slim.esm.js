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
}
.cm-fields dt { font-weight:600; opacity:.75; }
.cm-fields dd { margin:0; }

/* ---- Collapsible ---- */
.cm-details { border:1px solid var(--bd); border-radius:8px; margin:12px 0; overflow:hidden; }
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
`;var A=["success","danger","warning","info","tip","muted"],z={ok:"success",pass:"success",error:"danger",fail:"danger",warn:"warning",note:"info",hint:"tip",skip:"muted"},ae=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,le=/^[a-zA-Z][a-zA-Z0-9]*$/;function S(r){return B(r)||le.test(r)}function v(r){if(typeof r!="string")return null;let n=r.toLowerCase();return A.includes(n)?n:Object.prototype.hasOwnProperty.call(z,n)?z[n]:null}function B(r){return typeof r=="string"&&ae.test(r)}function $(r){if(typeof r!="string"||r.length===0)return null;if(r.toLowerCase().startsWith("color=")){let e=r.slice(6);return S(e)?{tone:null,color:e}:null}if(B(r))return{tone:null,color:r};let n=v(r);return n?{tone:n,color:null}:null}var fe={"--cm-success-fg":"#1a7f37","--cm-success-bg":"#dafbe1","--cm-success-bd":"#2da44e","--cm-danger-fg":"#cf222e","--cm-danger-bg":"#ffebe9","--cm-danger-bd":"#ff8182","--cm-warning-fg":"#9a6700","--cm-warning-bg":"#fff8c5","--cm-warning-bd":"#d4a72c","--cm-info-fg":"#0969da","--cm-info-bg":"#ddf4ff","--cm-info-bd":"#54aeff","--cm-tip-fg":"#0f7b6c","--cm-tip-bg":"#d3f5f0","--cm-tip-bd":"#3bc4b0","--cm-muted-fg":"#656d76","--cm-muted-bg":"#f6f8fa","--cm-muted-bd":"#d0d7de","--cm-neutral-bg":"#f6f8fa","--cm-neutral-bd":"#d0d7de"},me={"--cm-success-fg":"#3fb950","--cm-success-bg":"#12261e","--cm-success-bd":"#238636","--cm-danger-fg":"#f85149","--cm-danger-bg":"#25171c","--cm-danger-bd":"#da3633","--cm-warning-fg":"#d29922","--cm-warning-bg":"#272115","--cm-warning-bd":"#9e6a03","--cm-info-fg":"#58a6ff","--cm-info-bg":"#0d2233","--cm-info-bd":"#1f6feb","--cm-tip-fg":"#56d4c3","--cm-tip-bg":"#0c2620","--cm-tip-bd":"#1c6f63","--cm-muted-fg":"#8b949e","--cm-muted-bg":"#161b22","--cm-muted-bd":"#30363d","--cm-neutral-bg":"#161b22","--cm-neutral-bd":"#30363d"},de={"--cm-success-fg":"#047857","--cm-success-bg":"#d1fae5","--cm-success-bd":"#10b981","--cm-danger-fg":"#be123c","--cm-danger-bg":"#ffe4e6","--cm-danger-bd":"#fb7185","--cm-warning-fg":"#a16207","--cm-warning-bg":"#fef9c3","--cm-warning-bd":"#eab308","--cm-info-fg":"#0369a1","--cm-info-bg":"#e0f2fe","--cm-info-bd":"#38bdf8","--cm-tip-fg":"#0f766e","--cm-tip-bg":"#ccfbf1","--cm-tip-bd":"#2dd4bf","--cm-muted-fg":"#475569","--cm-muted-bg":"#f1f5f9","--cm-muted-bd":"#cbd5e1","--cm-neutral-bg":"#f8fafc","--cm-neutral-bd":"#cbd5e1"},ue={"--cm-success-fg":"#4d7c0f","--cm-success-bg":"#ecfccb","--cm-success-bd":"#84cc16","--cm-danger-fg":"#be123c","--cm-danger-bg":"#fff1f2","--cm-danger-bd":"#fb7185","--cm-warning-fg":"#c2410c","--cm-warning-bg":"#ffedd5","--cm-warning-bd":"#fb923c","--cm-info-fg":"#7e22ce","--cm-info-bg":"#f3e8ff","--cm-info-bd":"#c084fc","--cm-tip-fg":"#be185d","--cm-tip-bg":"#fce7f3","--cm-tip-bd":"#f472b6","--cm-muted-fg":"#6b7280","--cm-muted-bg":"#f9fafb","--cm-muted-bd":"#d1d5db","--cm-neutral-bg":"#fff7ed","--cm-neutral-bd":"#fed7aa"},ge={"--cm-success-fg":"#262626","--cm-success-bg":"#f5f5f5","--cm-success-bd":"#737373","--cm-danger-fg":"#171717","--cm-danger-bg":"#e5e5e5","--cm-danger-bd":"#525252","--cm-warning-fg":"#404040","--cm-warning-bg":"#fafafa","--cm-warning-bd":"#a3a3a3","--cm-info-fg":"#262626","--cm-info-bg":"#f5f5f5","--cm-info-bd":"#737373","--cm-tip-fg":"#404040","--cm-tip-bg":"#fafafa","--cm-tip-bd":"#a3a3a3","--cm-muted-fg":"#737373","--cm-muted-bg":"#fafafa","--cm-muted-bd":"#d4d4d4","--cm-neutral-bg":"#fafafa","--cm-neutral-bd":"#d4d4d4"};function y(r){return Object.freeze({...r})}var _=Object.freeze({"github-light":y(fe),"github-dark":y(me),ocean:y(de),sunset:y(ue),monochrome:y(ge)}),be={foreground:"fg",background:"bg",border:"bd"};function q(r,n){if(typeof r!="string"||!S(r))throw new Error(`unsafe theme color at ${n}`);return r}function M(r="github-light"){let n=typeof r=="string"?{preset:r}:r;if(!n||typeof n!="object"||Array.isArray(n))throw new TypeError("theme must be a preset name or configuration object");let e=n.preset||"github-light",c=_[e];if(!c)throw new Error(`unknown theme preset "${e}"`);let t={...c};for(let[o,i]of Object.entries(n.tones||{})){if(!A.includes(o))throw new Error(`unknown theme tone "${o}"`);for(let[s,a]of Object.entries(i||{})){let l=be[s];if(!l)throw new Error(`unknown theme slot "${s}"`);t[`--cm-${o}-${l}`]=q(a,`tones.${o}.${s}`)}}for(let[o,i]of Object.entries(n.neutral||{})){if(o!=="background"&&o!=="border")throw new Error(`unknown theme slot "${o}"`);let s=o==="background"?"bg":"bd";t[`--cm-neutral-${s}`]=q(i,`neutral.${o}`)}return t}function G(r,n){let e=r&&r.documentElement?r.documentElement:r;if(!e||!e.style||typeof e.style.setProperty!="function")throw new TypeError("theme target must be a style-capable Element or Document");for(let[c,t]of Object.entries(M(n)))e.style.setProperty(c,t);return e}var pe=91,he={"!":"pill",".":"text","=":"meter"};function xe(r){return r.replace(/\\([\s\S])/g,"$1")}var W=/\s/;function we(r,n,e){let c=n;for(;c<e&&W.test(r[c]);)c++;let t=c;for(;t<e&&!W.test(r[t]);)t++;return t===c?null:{specToken:r.slice(c,t),restStart:t}}function ke(r){let n,e=r.match(/^(\d+(?:\.\d+)?)\s*%$/),c=r.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);if(e)n=parseFloat(e[1]);else if(c){let t=parseFloat(c[2]);if(t===0)return null;n=parseFloat(c[1])/t*100}else return null;return n=Math.max(0,Math.min(100,n)),String(+n.toFixed(2))}function K(r,n,e,c){let t=r[n];if(t!==void 0&&t.from<=c&&(t.at===-1||c<=t.at))return t.at;let o=r.src.indexOf(e,c);return r[n]={from:c,at:o},o}function ve(r,n,e){let c=0;for(let t=n-1;t>=e&&r.charCodeAt(t)===92;t--)c++;return(c&1)===1}function X(r,n,e,c,t,o){let i=K(r,n,e,c);for(;i!==-1&&i<o&&ve(r.src,i,t);)i=K(r,n,e,i+1);return i}function ye(r,n){let e=r.posMax,c=X(r,"_cmBr","]",n,n,e);if(c===-1||c>=e)return-1;let t=X(r,"_cmNl",`
`,n,n,e);return t!==-1&&t<c?-1:c}function $e(r){return function(e,c){let t=e.pos;if(e.src.charCodeAt(t)!==pe)return!1;let o=he[e.src[t+1]];if(!o||!r[o])return!1;let i=ye(e,t+2);if(i===-1)return!1;let s=e.src,a=we(s,t+2,i);if(!a)return!1;let l=$(a.specToken);if(!l)return!1;let f=xe(s.slice(a.restStart,i).trim()),b;if(o==="meter"){if(!f)return!1;let p=ke(f);if(p===null)return!1;c||(b=e.push("cm_meter","",0),b.meta={...l,value:f,width:p})}else if(o==="text"){if(!f)return!1;c||(b=e.push("cm_text","",0),b.meta={...l,label:f})}else{let p=f||(l.tone?a.specToken.toUpperCase():l.color);c||(b=e.push("cm_pill","",0),b.meta={...l,label:p})}return e.pos=i+1,!0}}function O(r,n){let e=r.color?" cm-custom":"",c=r.tone?` data-tone="${r.tone}"`:"",t=r.color?` style="--fg:${n(r.color)}"`:"";return{custom:e,tone:c,style:t}}function I(r,n){r.inline.ruler.before("link","cm_inline",$e(n));let e=r.utils.escapeHtml;r.renderer.rules.cm_pill=(c,t)=>{let{custom:o,tone:i,style:s}=O(c[t].meta,e);return`<span class="cm-pill${o}"${i}${s}>${e(c[t].meta.label)}</span>`},r.renderer.rules.cm_text=(c,t)=>{let{custom:o,tone:i,style:s}=O(c[t].meta,e);return`<span class="cm-text${o}"${i}${s}>${e(c[t].meta.label)}</span>`},r.renderer.rules.cm_meter=(c,t)=>{let o=c[t].meta,{custom:i,tone:s,style:a}=O(o,e),l=` role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${o.width}" aria-valuetext="${e(o.value)}"`;return`<span class="cm-meter${i}"${s}${a}${l}><span class="cm-track"><span class="cm-fill" style="width:${o.width}%"></span></span><span class="cm-val">${e(o.value)}</span></span>`}}var Ce={"++":{kind:"add",close:"++}"},"--":{kind:"del",close:"--}"},"~~":{kind:"sub",close:"~~}"},"==":{kind:"mark",close:"==}"},">>":{kind:"comment",close:"<<}"}};function Te(r,n,e){let c="_cmCritic"+n,t=r[c];if(t!==void 0&&t.from<=e&&(t.at===-1||e<=t.at))return t.at;let o=r.src.indexOf(n,e);return r[c]={from:e,at:o},o}function Ee(r,n){let e=r.pos,c=r.src;if(c.charCodeAt(e)!==123)return!1;let t=Ce[c.slice(e+1,e+3)];if(!t)return!1;let o=e+3,i=Te(r,t.close,o);if(i===-1||i+t.close.length>r.posMax)return!1;let s=c.slice(o,i);if(!n){let a=r.push("cm_critic","",0);if(t.kind==="sub"){let l=s.indexOf("~>");a.meta={kind:"sub",old:l===-1?s:s.slice(0,l),neu:l===-1?"":s.slice(l+2)}}else a.meta={kind:t.kind,content:s}}return r.pos=i+t.close.length,!0}function P(r){r.inline.ruler.before("emphasis","cm_critic",Ee);let n=r.utils.escapeHtml;r.renderer.rules.cm_critic=(e,c)=>{let t=e[c].meta;switch(t.kind){case"add":return`<ins class="crit-add">${n(t.content)}</ins>`;case"del":return`<del class="crit-del">${n(t.content)}</del>`;case"sub":return`<del class="crit-del">${n(t.old)}</del><ins class="crit-add">${n(t.neu)}</ins>`;case"mark":return`<mark class="crit-mark">${n(t.content)}</mark>`;case"comment":return`<span class="crit-comment">${n(t.content)}</span>`;default:return""}}}var L=58,Ae=3,Se=r=>r.charAt(0).toUpperCase()+r.slice(1);function _e(r){if(!r)return null;let n=r.split(/\s+/),e=n.shift().toLowerCase(),c,t=null,o=null,i=!1;if(e==="details")c="details";else{if(e==="fields")return{structure:"fields"};if(e==="block")c="callout";else{let a=v(e);if(!a)return null;c="callout",t=a}}for(;n.length;){let a=n[0],l=a.toLowerCase();if(c==="details"&&l==="open"){i=!0,n.shift();continue}if(l.startsWith("color=")){let f=$(a);if(f&&f.color){o=f.color,n.shift();continue}break}if(c==="details"&&t===null&&v(a)){t=v(a),n.shift();continue}break}let s=n.join(" ").trim();return c==="details"?{structure:c,tone:t,color:o,open:i,summary:s||"Details"}:{structure:c,tone:t,color:o,title:s||(t?Se(t):"")}}function Z(r,n,e){let c=0,t=n;for(;t<e&&r.charCodeAt(t)===L;)c++,t++;return c}function Me(r){return function(e,c,t,o){let i=e.bMarks[c]+e.tShift[c],s=e.eMarks[c];if(e.src.charCodeAt(i)!==L)return!1;let a=Z(e.src,i,s);if(a<Ae)return!1;let l=_e(e.src.slice(i+a,s).trim());if(!l||!r[l.structure])return!1;if(o)return!0;let f=c,b=!1,p=0,T=0;for(;f++,!(f>=t);){let m=e.bMarks[f]+e.tShift[f],d=e.eMarks[f],h=e.sCount[f]-e.blkIndent;if(p){if(h<4&&e.src.charCodeAt(m)===p){let g=m;for(;g<d&&e.src.charCodeAt(g)===p;)g++;if(g-m>=T){let x=g;for(;x<d&&(e.src.charCodeAt(x)===32||e.src.charCodeAt(x)===9);)x++;x>=d&&(p=0,T=0)}}continue}let u=e.src.charCodeAt(m);if(h<4&&(u===96||u===126)){let g=m;for(;g<d&&e.src.charCodeAt(g)===u;)g++;if(g-m>=3){let x=!0;if(u===96){for(let E=g;E<d;E++)if(e.src.charCodeAt(E)===96){x=!1;break}}if(x){p=u,T=g-m;continue}}}if(u!==L||h>=4)continue;let w=Z(e.src,m,d);if(w<a)continue;let k=m+w;for(;k<d&&(e.src.charCodeAt(k)===32||e.src.charCodeAt(k)===9);)k++;if(!(k<d)){b=!0;break}}let oe=e.parentType,ie=e.lineMax;if(e.parentType="chroma_container",e.lineMax=f,l.structure==="fields"){let m=[];for(let h=c+1;h<f;h++){let u=e.src.slice(e.bMarks[h]+e.tShift[h],e.eMarks[h]);if(!u.trim())continue;let w=u.indexOf(":");w===-1?m.push([u.trim(),""]):m.push([u.slice(0,w).trim(),u.slice(w+1).trim()])}let d=e.push("cm_fields","",0);d.meta={rows:m},d.map=[c,f]}else{let m=e.push("cm_container_open","div",1);m.meta=l,m.block=!0,m.map=[c,f],e.md.block.tokenize(e,c+1,f);let d=e.push("cm_container_close","div",-1);d.meta=l,d.block=!0}return e.parentType=oe,e.lineMax=ie,e.line=f+(b?1:0),!0}}function R(r,n){r.block.ruler.before("fence","cm_container",Me(n),{alt:["paragraph","reference","blockquote","list"]});let e=r.utils.escapeHtml;function c(t){let o=t.color?" cm-custom":"",i=t.color?` style="--fg:${e(t.color)}"`:"",s=!t.color&&t.tone?` data-tone="${t.tone}"`:"";return{custom:o,style:i,tone:s}}r.renderer.rules.cm_container_open=(t,o)=>{let i=t[o].meta,{custom:s,style:a,tone:l}=c(i);if(i.structure==="details"){let b=i.open?" open":"";return`<details class="cm-details${s}"${l}${a}${b}><summary>${r.renderInline(i.summary)}</summary><div class="cm-body">`}let f=`<div class="cm-block${s}"${l}${a}>`;return i.title&&(f+=`<div class="cm-title">${r.renderInline(i.title)}</div>`),f+'<div class="cm-body">'},r.renderer.rules.cm_container_close=(t,o)=>t[o].meta.structure==="details"?"</div></details>":"</div></div>",r.renderer.rules.cm_fields=(t,o)=>{let i='<dl class="cm-fields">';for(let[s,a]of t[o].meta.rows)i+=`<dt>${e(s)}</dt><dd>${r.renderInline(a)}</dd>`;return i+"</dl>"}}var Oe={container:!0,details:!0,fields:!0,pill:!0,text:!0,meter:!0,critic:!0};function N(r,n={}){let e={...Oe,...n};(e.pill||e.text||e.meter)&&I(r,{pill:e.pill,text:e.text,meter:e.meter}),e.critic&&P(r),(e.container||e.details||e.fields)&&R(r,{callout:e.container,details:e.details,fields:e.fields})}var V="chromamark-theme",C="data-chromamark-done",Y="data-chromamark-src",Ie="data-chromamark-error",Pe='script[type="text/chromamark"], template.chromamark, [data-chromamark], [data-chromamark-src], .chromamark',H=null,F="";function J(r){if(typeof r!="function")throw new TypeError("renderer must be a function");H=r}function Le(r,n){if(!r||typeof r.use!="function"||typeof r.render!="function")throw new TypeError("MarkdownIt instance must expose use() and render()");return r.use(N,n),J(e=>r.render(e)),r}function j(r){F=r||""}function D(r,n){if(!H)throw new Error("configureRenderer() must be called before rendering");return H(String(r!=null?r:""),n)}function Q(r){let n=r||(typeof document!="undefined"?document:null);if(!n||n.getElementById(V))return;let e=n.createElement("style");e.id=V,e.textContent=F,(n.head||n.documentElement).appendChild(e)}function Re(r){let n=r.replace(/\r/g,"").split(`
`);for(;n.length&&n[0].trim()==="";)n.shift();for(;n.length&&n[n.length-1].trim()==="";)n.pop();let e=null;for(let t of n){if(!t.trim())continue;let o=t.match(/^[ \t]*/)[0];if(e===null){e=o;continue}let i=0,s=Math.min(e.length,o.length);for(;i<s&&e[i]===o[i];)i++;if(e=e.slice(0,i),!e)break}let c=e?e.length:0;return n.map(t=>t.slice(c)).join(`
`)}function ee(r){return typeof r=="string"?document.querySelector(r):r}function Ne(r,n){return n==="template"&&r.content?r.content.textContent||"":r.textContent||""}function re(r,n){let e=ee(r);if(!e||e.hasAttribute(C))return null;if(e.hasAttribute(Y))return te(e,n);let c=e.ownerDocument||document,t=(e.tagName||"").toLowerCase(),o=D(Re(Ne(e,t)),n);if(e.setAttribute(C,""),t==="script"||t==="template"){let i=c.createElement("div");return i.className="chromamark-output",i.innerHTML=o,e.parentNode&&e.parentNode.insertBefore(i,e.nextSibling),i}return e.innerHTML=o,e.classList.add("chromamark-output"),e}function te(r,n){let e=ee(r);if(!e||e.hasAttribute(C))return Promise.resolve(null);let c=e.getAttribute(Y);if(!c)return Promise.resolve(null);e.setAttribute(C,"");let t=e.ownerDocument&&e.ownerDocument.defaultView,o=t&&t.fetch||(typeof fetch!="undefined"?fetch:null),i=s=>(e.setAttribute(Ie,s),null);return o?Promise.resolve(o(c)).then(s=>{if(!s||!s.ok)throw new Error(`HTTP ${s?s.status:"?"}`);return s.text()}).then(s=>(e.innerHTML=D(s,n),e.classList.add("chromamark-output"),e)).catch(s=>i(`ChromaMark: failed to load ${c} (${s.message||s})`)):Promise.resolve(i("ChromaMark: fetch is unavailable"))}function ne(r,n){return Array.from(document.querySelectorAll(r||Pe)).map(e=>re(e,n))}function He(r={}){return Q(),ne(r.selector,r)}var Fe={configureRenderer:J,configureMarkdownIt:Le,configureTheme:j,render:D,renderElement:re,renderAll:ne,renderSrc:te,injectTheme:Q,autoRender:He,applyTheme:G,resolveTheme:M,THEME_PRESETS:_,get theme(){return F}},ce=Fe;j(U);var nr=ce;export{Fe as ChromaMarkSlim,_ as THEME_PRESETS,G as applyTheme,He as autoRender,Le as configureMarkdownIt,J as configureRenderer,j as configureTheme,nr as default,Q as injectTheme,D as render,ne as renderAll,re as renderElement,te as renderSrc,M as resolveTheme,F as theme};
