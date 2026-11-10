"use client";
import {useEffect,useState} from 'react';
// URL selections are public. Never include browser-local baselines or private data.
export function useUrlSelection(key:string, fallback:string, allowed?:string[]) {
 const [value,setValue]=useState(fallback);
 useEffect(()=>{const read=()=>{const raw=new URLSearchParams(window.location.search).get(key);setValue(raw!==null&&raw.length<=150&&(!allowed||allowed.includes(raw))?raw:fallback);};read();window.addEventListener('popstate',read);return()=>window.removeEventListener('popstate',read);},[key,fallback,allowed?.join('|')]);
 function change(next:string){setValue(next);const url=new URL(window.location.href);if(next===fallback)url.searchParams.delete(key);else url.searchParams.set(key,next.slice(0,150));window.history.replaceState(window.history.state,'',url);}
 return [value,change] as const;
}
