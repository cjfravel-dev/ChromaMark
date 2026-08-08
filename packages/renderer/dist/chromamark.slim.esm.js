var z=`/*
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

/* ---- Collapsible table rows ---- */
.cm-row-toggle {
  appearance:none; background:none; border:0; padding:0; margin-right:6px; cursor:pointer;
  color:inherit; font:inherit; line-height:1; display:inline-block; visibility:hidden;
}
.cm-row-toggle::before { content:"\\25B8"; display:inline-block; opacity:.7; transition:transform .15s ease; }
.cm-row-toggle[aria-expanded="true"]::before { transform:rotate(90deg); }
/* Until the enhancer runs there is nothing to toggle, so the control stays
   invisible and every row remains visible (conformance level 1). It keeps its
   box so revealing it never reflows the row \u2014 incremental previews re-render
   constantly, and a late layout shift makes host scroll-sync jump. */
[data-cm-rowgroups="ready"] .cm-row-toggle { visibility:visible; }
.cm-row-child > td:first-child { padding-left:calc(6px + var(--cm-row-indent, 1.25em)); }
.cm-row[data-cm-depth="2"] > td:first-child { --cm-row-indent:2.5em; }
.cm-row[data-cm-depth="3"] > td:first-child { --cm-row-indent:3.75em; }
.cm-row[data-cm-depth="4"] > td:first-child { --cm-row-indent:5em; }
.cm-row[hidden] { display:none; }
`;var _=["success","danger","warning","info","tip","muted"],B={ok:"success",pass:"success",error:"danger",fail:"danger",warn:"warning",note:"info",hint:"tip",skip:"muted"},le=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,de=/^[a-zA-Z][a-zA-Z0-9]*$/;function A(t){return G(t)||de.test(t)}function v(t){if(typeof t!="string")return null;let n=t.toLowerCase();return _.includes(n)?n:Object.prototype.hasOwnProperty.call(B,n)?B[n]:null}function G(t){return typeof t=="string"&&le.test(t)}function $(t){if(typeof t!="string"||t.length===0)return null;if(t.toLowerCase().startsWith("color=")){let e=t.slice(6);return A(e)?{tone:null,color:e}:null}if(G(t))return{tone:null,color:t};let n=v(t);return n?{tone:n,color:null}:null}var fe={"--cm-success-fg":"#1a7f37","--cm-success-bg":"#dafbe1","--cm-success-bd":"#2da44e","--cm-danger-fg":"#cf222e","--cm-danger-bg":"#ffebe9","--cm-danger-bd":"#ff8182","--cm-warning-fg":"#9a6700","--cm-warning-bg":"#fff8c5","--cm-warning-bd":"#d4a72c","--cm-info-fg":"#0969da","--cm-info-bg":"#ddf4ff","--cm-info-bd":"#54aeff","--cm-tip-fg":"#0f7b6c","--cm-tip-bg":"#d3f5f0","--cm-tip-bd":"#3bc4b0","--cm-muted-fg":"#656d76","--cm-muted-bg":"#f6f8fa","--cm-muted-bd":"#d0d7de","--cm-neutral-bg":"#f6f8fa","--cm-neutral-bd":"#d0d7de","--cm-content-fg":"#1f2328"},me={"--cm-success-fg":"#3fb950","--cm-success-bg":"#12261e","--cm-success-bd":"#238636","--cm-danger-fg":"#f85149","--cm-danger-bg":"#25171c","--cm-danger-bd":"#da3633","--cm-warning-fg":"#d29922","--cm-warning-bg":"#272115","--cm-warning-bd":"#9e6a03","--cm-info-fg":"#58a6ff","--cm-info-bg":"#0d2233","--cm-info-bd":"#1f6feb","--cm-tip-fg":"#56d4c3","--cm-tip-bg":"#0c2620","--cm-tip-bd":"#1c6f63","--cm-muted-fg":"#8b949e","--cm-muted-bg":"#161b22","--cm-muted-bd":"#30363d","--cm-neutral-bg":"#161b22","--cm-neutral-bd":"#30363d","--cm-content-fg":"#e6edf3"},ue={"--cm-success-fg":"#047857","--cm-success-bg":"#d1fae5","--cm-success-bd":"#10b981","--cm-danger-fg":"#be123c","--cm-danger-bg":"#ffe4e6","--cm-danger-bd":"#fb7185","--cm-warning-fg":"#a16207","--cm-warning-bg":"#fef9c3","--cm-warning-bd":"#eab308","--cm-info-fg":"#0369a1","--cm-info-bg":"#e0f2fe","--cm-info-bd":"#38bdf8","--cm-tip-fg":"#0f766e","--cm-tip-bg":"#ccfbf1","--cm-tip-bd":"#2dd4bf","--cm-muted-fg":"#475569","--cm-muted-bg":"#f1f5f9","--cm-muted-bd":"#cbd5e1","--cm-neutral-bg":"#f8fafc","--cm-neutral-bd":"#cbd5e1","--cm-content-fg":"#0f172a"},ge={"--cm-success-fg":"#4d7c0f","--cm-success-bg":"#ecfccb","--cm-success-bd":"#84cc16","--cm-danger-fg":"#be123c","--cm-danger-bg":"#fff1f2","--cm-danger-bd":"#fb7185","--cm-warning-fg":"#c2410c","--cm-warning-bg":"#ffedd5","--cm-warning-bd":"#fb923c","--cm-info-fg":"#7e22ce","--cm-info-bg":"#f3e8ff","--cm-info-bd":"#c084fc","--cm-tip-fg":"#be185d","--cm-tip-bg":"#fce7f3","--cm-tip-bd":"#f472b6","--cm-muted-fg":"#6b7280","--cm-muted-bg":"#f9fafb","--cm-muted-bd":"#d1d5db","--cm-neutral-bg":"#fff7ed","--cm-neutral-bd":"#fed7aa","--cm-content-fg":"#431407"},be={"--cm-success-fg":"#262626","--cm-success-bg":"#f5f5f5","--cm-success-bd":"#737373","--cm-danger-fg":"#171717","--cm-danger-bg":"#e5e5e5","--cm-danger-bd":"#525252","--cm-warning-fg":"#404040","--cm-warning-bg":"#fafafa","--cm-warning-bd":"#a3a3a3","--cm-info-fg":"#262626","--cm-info-bg":"#f5f5f5","--cm-info-bd":"#737373","--cm-tip-fg":"#404040","--cm-tip-bg":"#fafafa","--cm-tip-bd":"#a3a3a3","--cm-muted-fg":"#737373","--cm-muted-bg":"#fafafa","--cm-muted-bd":"#d4d4d4","--cm-neutral-bg":"#fafafa","--cm-neutral-bd":"#d4d4d4","--cm-content-fg":"#171717"};function y(t){return Object.freeze({...t})}var S=Object.freeze({"github-light":y(fe),"github-dark":y(me),ocean:y(ue),sunset:y(ge),monochrome:y(be)}),pe={foreground:"fg",background:"bg",border:"bd"};function q(t,n){if(typeof t!="string"||!A(t))throw new Error(`unsafe theme color at ${n}`);return t}function M(t="github-light"){let n=typeof t=="string"?{preset:t}:t;if(!n||typeof n!="object"||Array.isArray(n))throw new TypeError("theme must be a preset name or configuration object");let e=n.preset||"github-light",c=S[e];if(!c)throw new Error(`unknown theme preset "${e}"`);let r={...c};for(let[i,o]of Object.entries(n.tones||{})){if(!_.includes(i))throw new Error(`unknown theme tone "${i}"`);for(let[s,l]of Object.entries(o||{})){let a=pe[s];if(!a)throw new Error(`unknown theme slot "${s}"`);r[`--cm-${i}-${a}`]=q(l,`tones.${i}.${s}`)}}for(let[i,o]of Object.entries(n.neutral||{})){if(!["foreground","background","border"].includes(i))throw new Error(`unknown theme slot "${i}"`);let s=i==="foreground"?"--cm-content-fg":`--cm-neutral-${i==="background"?"bg":"bd"}`;r[s]=q(o,`neutral.${i}`)}return r}function K(t,n){let e=t&&t.documentElement?t.documentElement:t;if(!e||!e.style||typeof e.style.setProperty!="function")throw new TypeError("theme target must be a style-capable Element or Document");for(let[c,r]of Object.entries(M(n)))e.style.setProperty(c,r);return e}var he=91,we={"!":"pill",".":"text","=":"meter"};function xe(t){return t.replace(/\\([\s\S])/g,"$1")}var W=/\s/;function ke(t,n,e){let c=n;for(;c<e&&W.test(t[c]);)c++;let r=c;for(;r<e&&!W.test(t[r]);)r++;return r===c?null:{specToken:t.slice(c,r),restStart:r}}function ve(t){let n,e=t.match(/^(\d+(?:\.\d+)?)\s*%$/),c=t.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);if(e)n=parseFloat(e[1]);else if(c){let r=parseFloat(c[2]);if(r===0)return null;n=parseFloat(c[1])/r*100}else return null;return n=Math.max(0,Math.min(100,n)),String(+n.toFixed(2))}function X(t,n,e,c){let r=t[n];if(r!==void 0&&r.from<=c&&(r.at===-1||c<=r.at))return r.at;let i=t.src.indexOf(e,c);return t[n]={from:c,at:i},i}function ye(t,n,e){let c=0;for(let r=n-1;r>=e&&t.charCodeAt(r)===92;r--)c++;return(c&1)===1}function Z(t,n,e,c,r,i){let o=X(t,n,e,c);for(;o!==-1&&o<i&&ye(t.src,o,r);)o=X(t,n,e,o+1);return o}function $e(t,n){let e=t.posMax,c=Z(t,"_cmBr","]",n,n,e);if(c===-1||c>=e)return-1;let r=Z(t,"_cmNl",`
`,n,n,e);return r!==-1&&r<c?-1:c}function Ce(t){return function(e,c){let r=e.pos;if(e.src.charCodeAt(r)!==he)return!1;let i=we[e.src[r+1]];if(!i||!t[i])return!1;let o=$e(e,r+2);if(o===-1)return!1;let s=e.src,l=ke(s,r+2,o);if(!l)return!1;let a=$(l.specToken);if(!a)return!1;let d=xe(s.slice(l.restStart,o).trim()),m;if(i==="meter"){if(!d)return!1;let p=ve(d);if(p===null)return!1;c||(m=e.push("cm_meter","",0),m.meta={...a,value:d,width:p})}else if(i==="text"){if(!d)return!1;c||(m=e.push("cm_text","",0),m.meta={...a,label:d})}else{let p=d||(a.tone?l.specToken.toUpperCase():a.color);c||(m=e.push("cm_pill","",0),m.meta={...a,label:p})}return e.pos=o+1,!0}}function O(t,n){let e=t.color?" cm-custom":"",c=t.tone?` data-tone="${t.tone}"`:"",r=t.color?` style="--fg:${n(t.color)}"`:"";return{custom:e,tone:c,style:r}}function P(t,n){t.inline.ruler.before("link","cm_inline",Ce(n));let e=t.utils.escapeHtml;t.renderer.rules.cm_pill=(c,r)=>{let{custom:i,tone:o,style:s}=O(c[r].meta,e);return`<span class="cm-pill${i}"${o}${s}>${e(c[r].meta.label)}</span>`},t.renderer.rules.cm_text=(c,r)=>{let{custom:i,tone:o,style:s}=O(c[r].meta,e);return`<span class="cm-text${i}"${o}${s}>${e(c[r].meta.label)}</span>`},t.renderer.rules.cm_meter=(c,r)=>{let i=c[r].meta,{custom:o,tone:s,style:l}=O(i,e),a=` role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${i.width}" aria-valuetext="${e(i.value)}"`;return`<span class="cm-meter${o}"${s}${l}${a}><span class="cm-track"><span class="cm-fill" style="width:${i.width}%"></span></span><span class="cm-val">${e(i.value)}</span></span>`}}var Te={"++":{kind:"add",close:"++}"},"--":{kind:"del",close:"--}"},"~~":{kind:"sub",close:"~~}"},"==":{kind:"mark",close:"==}"},">>":{kind:"comment",close:"<<}"}};function Ee(t,n,e){let c="_cmCritic"+n,r=t[c];if(r!==void 0&&r.from<=e&&(r.at===-1||e<=r.at))return r.at;let i=t.src.indexOf(n,e);return t[c]={from:e,at:i},i}function _e(t,n){let e=t.pos,c=t.src;if(c.charCodeAt(e)!==123)return!1;let r=Te[c.slice(e+1,e+3)];if(!r)return!1;let i=e+3,o=Ee(t,r.close,i);if(o===-1||o+r.close.length>t.posMax)return!1;let s=c.slice(i,o);if(!n){let l=t.push("cm_critic","",0);if(r.kind==="sub"){let a=s.indexOf("~>");l.meta={kind:"sub",old:a===-1?s:s.slice(0,a),neu:a===-1?"":s.slice(a+2)}}else l.meta={kind:r.kind,content:s}}return t.pos=o+r.close.length,!0}function I(t){t.inline.ruler.before("emphasis","cm_critic",_e);let n=t.utils.escapeHtml;t.renderer.rules.cm_critic=(e,c)=>{let r=e[c].meta;switch(r.kind){case"add":return`<ins class="crit-add">${n(r.content)}</ins>`;case"del":return`<del class="crit-del">${n(r.content)}</del>`;case"sub":return`<del class="crit-del">${n(r.old)}</del><ins class="crit-add">${n(r.neu)}</ins>`;case"mark":return`<mark class="crit-mark">${n(r.content)}</mark>`;case"comment":return`<span class="crit-comment">${n(r.content)}</span>`;default:return""}}}var R=58,Ae=3,Se=t=>t.charAt(0).toUpperCase()+t.slice(1);function Me(t){if(!t)return null;let n=t.split(/\s+/),e=n.shift().toLowerCase(),c,r=null,i=null,o=!1;if(e==="details")c="details";else{if(e==="fields")return{structure:"fields"};if(e==="block")c="callout";else{let l=v(e);if(!l)return null;c="callout",r=l}}for(;n.length;){let l=n[0],a=l.toLowerCase();if(c==="details"&&a==="open"){o=!0,n.shift();continue}if(a.startsWith("color=")){let d=$(l);if(d&&d.color){i=d.color,n.shift();continue}break}if(c==="details"&&r===null&&v(l)){r=v(l),n.shift();continue}break}let s=n.join(" ").trim();return c==="details"?{structure:c,tone:r,color:i,open:o,summary:s||"Details"}:{structure:c,tone:r,color:i,title:s||(r?Se(r):"")}}function V(t,n,e){let c=0,r=n;for(;r<e&&t.charCodeAt(r)===R;)c++,r++;return c}function Oe(t){return function(e,c,r,i){let o=e.bMarks[c]+e.tShift[c],s=e.eMarks[c];if(e.src.charCodeAt(o)!==R)return!1;let l=V(e.src,o,s);if(l<Ae)return!1;let a=Me(e.src.slice(o+l,s).trim());if(!a||!t[a.structure])return!1;if(i)return!0;let d=c,m=!1,p=0,T=0;for(;d++,!(d>=r);){let f=e.bMarks[d]+e.tShift[d],u=e.eMarks[d],h=e.sCount[d]-e.blkIndent;if(p){if(h<4&&e.src.charCodeAt(f)===p){let b=f;for(;b<u&&e.src.charCodeAt(b)===p;)b++;if(b-f>=T){let w=b;for(;w<u&&(e.src.charCodeAt(w)===32||e.src.charCodeAt(w)===9);)w++;w>=u&&(p=0,T=0)}}continue}let g=e.src.charCodeAt(f);if(h<4&&(g===96||g===126)){let b=f;for(;b<u&&e.src.charCodeAt(b)===g;)b++;if(b-f>=3){let w=!0;if(g===96){for(let E=b;E<u;E++)if(e.src.charCodeAt(E)===96){w=!1;break}}if(w){p=g,T=b-f;continue}}}if(g!==R||h>=4)continue;let x=V(e.src,f,u);if(x<l)continue;let k=f+x;for(;k<u&&(e.src.charCodeAt(k)===32||e.src.charCodeAt(k)===9);)k++;if(!(k<u)){m=!0;break}}let ie=e.parentType,se=e.lineMax;if(e.parentType="chroma_container",e.lineMax=d,a.structure==="fields"){let f=[];for(let h=c+1;h<d;h++){let g=e.src.slice(e.bMarks[h]+e.tShift[h],e.eMarks[h]);if(!g.trim())continue;let x=g.indexOf(":");x===-1?f.push([g.trim(),""]):f.push([g.slice(0,x).trim(),g.slice(x+1).trim()])}let u=e.push("cm_fields","",0);u.meta={rows:f},u.map=[c,d]}else{let f=e.push("cm_container_open","div",1);f.meta=a,f.block=!0,f.map=[c,d],e.md.block.tokenize(e,c+1,d);let u=e.push("cm_container_close","div",-1);u.meta=a,u.block=!0}return e.parentType=ie,e.lineMax=se,e.line=d+(m?1:0),!0}}function L(t,n){t.block.ruler.before("fence","cm_container",Oe(n),{alt:["paragraph","reference","blockquote","list"]});let e=t.utils.escapeHtml;function c(r){let i=r.color?" cm-custom":"",o=r.color?` style="--fg:${e(r.color)}"`:"",s=!r.color&&r.tone?` data-tone="${r.tone}"`:"";return{custom:i,style:o,tone:s}}t.renderer.rules.cm_container_open=(r,i)=>{let o=r[i].meta,{custom:s,style:l,tone:a}=c(o);if(o.structure==="details"){let m=o.open?" open":"";return`<details class="cm-details${s}"${a}${l}${m}><summary>${t.renderInline(o.summary)}</summary><div class="cm-body">`}let d=`<div class="cm-block${s}"${a}${l}>`;return o.title&&(d+=`<div class="cm-title">${t.renderInline(o.title)}</div>`),d+'<div class="cm-body">'},t.renderer.rules.cm_container_close=(r,i)=>r[i].meta.structure==="details"?"</div></details>":"</div></div>",t.renderer.rules.cm_fields=(r,i)=>{let o='<dl class="cm-fields">';for(let[s,l]of r[i].meta.rows)o+=`<dt>${e(s)}</dt><dd>${t.renderInline(l)}</dd>`;return o+"</dl>"}}var Pe=/^(?:[\u21b3>][ \t]*)+/;function Ie(t){let n=Pe.exec(String(t!=null?t:""));return n?{depth:(n[0].match(/[\u21b3>]/g)||[]).length,rest:t.slice(n[0].length)}:null}function Re(t,n,e,c){let r=[],i=-1;c.forEach((o,s)=>{let l=i<0?0:Math.min(o?o.depth:0,i+1);r.push(l),i=l,o&&o.depth>0&&e[s].inline!==-1&&(n[e[s].inline].content=o.rest)});for(let o=e.length-1;o>=0;o--){let s=r[o],l=o+1<e.length&&r[o+1]>s,a="cm-row";l&&(a+=" cm-row-parent"),s>0&&(a+=" cm-row-child");let d=n[e[o].tr];if(d.attrSet("class",a),d.attrSet("data-cm-depth",String(s)),l&&e[o].inline!==-1){let m=new t.Token("cm_row_toggle","",0);m.hidden=!0,n.splice(e[o].inline,0,m)}}}function N(t){t.core.ruler.after("block","cm_rowgroups",n=>{let e=n.tokens,c=[],r=!1,i=()=>{let o=c.map(s=>s.inline===-1?null:Ie(e[s.inline].content));o.some(s=>s&&s.depth>0)&&Re(n,e,c,o),c=[]};for(let o=0;o<e.length;o++){let s=e[o].type;if(s==="tbody_open")r=!0;else if(s==="tbody_close")r=!1,i();else if(s==="tr_open"&&r){let l=-1;for(let a=o+1;a<e.length&&e[a].type!=="tr_close";a++)if(e[a].type==="inline"){l=a;break}c.push({tr:o,inline:l})}}return i(),!0}),t.renderer.rules.cm_row_toggle=()=>'<button class="cm-row-toggle" type="button" aria-expanded="true" aria-label="Toggle nested rows"></button>'}var Le={container:!0,details:!0,fields:!0,pill:!0,text:!0,meter:!0,critic:!0,rows:!0};function H(t,n={}){let e={...Le,...n};(e.pill||e.text||e.meter)&&P(t,{pill:e.pill,text:e.text,meter:e.meter}),e.critic&&I(t),e.rows&&N(t),(e.container||e.details||e.fields)&&L(t,{callout:e.container,details:e.details,fields:e.fields})}var Y="chromamark-theme",C="data-chromamark-done",J="data-chromamark-src",Ne="data-chromamark-error",He='script[type="text/chromamark"], template.chromamark, [data-chromamark], [data-chromamark-src], .chromamark',j=null,F="";function Q(t){if(typeof t!="function")throw new TypeError("renderer must be a function");j=t}function je(t,n){if(!t||typeof t.use!="function"||typeof t.render!="function")throw new TypeError("MarkdownIt instance must expose use() and render()");return t.use(H,n),Q(e=>t.render(e)),t}function D(t){F=t||""}function U(t,n){if(!j)throw new Error("configureRenderer() must be called before rendering");return j(String(t!=null?t:""),n)}function ee(t){let n=t||(typeof document!="undefined"?document:null);if(!n||n.getElementById(Y))return;let e=n.createElement("style");e.id=Y,e.textContent=F,(n.head||n.documentElement).appendChild(e)}function Fe(t){let n=t.replace(/\r/g,"").split(`
`);for(;n.length&&n[0].trim()==="";)n.shift();for(;n.length&&n[n.length-1].trim()==="";)n.pop();let e=null;for(let r of n){if(!r.trim())continue;let i=r.match(/^[ \t]*/)[0];if(e===null){e=i;continue}let o=0,s=Math.min(e.length,i.length);for(;o<s&&e[o]===i[o];)o++;if(e=e.slice(0,o),!e)break}let c=e?e.length:0;return n.map(r=>r.slice(c)).join(`
`)}function te(t){return typeof t=="string"?document.querySelector(t):t}function De(t,n){return n==="template"&&t.content?t.content.textContent||"":t.textContent||""}function re(t,n){let e=te(t);if(!e||e.hasAttribute(C))return null;if(e.hasAttribute(J))return ne(e,n);let c=e.ownerDocument||document,r=(e.tagName||"").toLowerCase(),i=U(Fe(De(e,r)),n);if(e.setAttribute(C,""),r==="script"||r==="template"){let o=c.createElement("div");return o.className="chromamark-output",o.innerHTML=i,e.parentNode&&e.parentNode.insertBefore(o,e.nextSibling),o}return e.innerHTML=i,e.classList.add("chromamark-output"),e}function ne(t,n){let e=te(t);if(!e||e.hasAttribute(C))return Promise.resolve(null);let c=e.getAttribute(J);if(!c)return Promise.resolve(null);e.setAttribute(C,"");let r=e.ownerDocument&&e.ownerDocument.defaultView,i=r&&r.fetch||(typeof fetch!="undefined"?fetch:null),o=s=>(e.setAttribute(Ne,s),null);return i?Promise.resolve().then(()=>i(c)).then(s=>{if(!s||!s.ok)throw new Error(`HTTP ${s?s.status:"?"}`);return s.text()}).then(s=>(e.innerHTML=U(s,n),e.classList.add("chromamark-output"),e)).catch(s=>o(`ChromaMark: failed to load ${c} (${s&&s.message||s})`)):Promise.resolve(o("ChromaMark: fetch is unavailable"))}function ce(t,n){return Array.from(document.querySelectorAll(t||He)).map(e=>re(e,n))}function Ue(t={}){return ee(),ce(t.selector,t)}var ze={configureRenderer:Q,configureMarkdownIt:je,configureTheme:D,render:U,renderElement:re,renderAll:ce,renderSrc:ne,injectTheme:ee,autoRender:Ue,applyTheme:K,resolveTheme:M,THEME_PRESETS:S,get theme(){return F}},oe=ze;D(z);var lt=oe;export{ze as ChromaMarkSlim,S as THEME_PRESETS,K as applyTheme,Ue as autoRender,je as configureMarkdownIt,Q as configureRenderer,D as configureTheme,lt as default,ee as injectTheme,U as render,ce as renderAll,re as renderElement,ne as renderSrc,M as resolveTheme,F as theme};
