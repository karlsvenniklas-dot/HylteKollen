"use client";
import {useState} from 'react';
export default function ShareSelection(){
 const [message,setMessage]=useState(''),[fallback,setFallback]=useState('');
 async function copy(){const url=window.location.href;try{await navigator.clipboard.writeText(url);setFallback('');setMessage('Länken till urvalet är kopierad. Lokal jämförelsepunkt delas inte.');}catch{setFallback(url);setMessage('Kopiera länken i fältet.');}}
 return <div className="share-selection"><button type="button" onClick={copy}>Kopiera länk till urvalet</button>{fallback&&<label>Länk till urvalet<input readOnly value={fallback} onFocus={e=>e.target.select()}/></label>}<p role="status">{message}</p></div>;
}
