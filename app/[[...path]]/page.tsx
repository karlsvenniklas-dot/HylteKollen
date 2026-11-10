import Hyltekollen from '../site';
export default async function Page({params}:{params:Promise<{path?:string[]}>}){const {path=[]}=await params;return <Hyltekollen view={path[0]||'senaste'} id={path[1]}/>}
