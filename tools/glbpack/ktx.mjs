// node tools/glbpack/ktx.mjs <in.glb> <out.glb>  -- store a packed GLB's textures as KTX2 (KHR_texture_basisu), keeping meshopt
// The browser uploads these GPU-compressed (ASTC/ETC2/BC on the device) after transcoding on worker threads, instead of decoding
// each WebP/JPEG to RGBA and building its mip chain on the main thread. All maps are ETC1S, normal maps at the top quality level;
// NU=1 stores normals as UASTC instead (sharper, but about twice the bytes). Needs toktx (KTX-Software 4.x) on PATH.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,EXTMeshoptCompression,KHRTextureBasisu} from '@gltf-transform/extensions';
import {listTextureSlots} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
import {execFileSync} from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
const [,,inp,out]=process.argv;
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(inp);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ktx-'));
/* alpha-cut cards stay as they are: desert.js rebuilds their mip chains from the decoded image to keep coverage at a distance */
const cut=new Set();for(const m of doc.getRoot().listMaterials())if(m.getAlphaMode()!=='OPAQUE'&&m.getBaseColorTexture())cut.add(m.getBaseColorTexture());
for(const [i,t] of doc.getRoot().listTextures().entries()){
  if(cut.has(t))continue;
  const slots=listTextureSlots(t),nrm=slots.some(s=>/normal/i.test(s)),srgb=slots.some(s=>/baseColor|emissive/i.test(s));
  const img=sharp(Buffer.from(t.getImage())),m=await img.metadata();
  /* block formats want sides that are a multiple of 4 */
  const w=Math.max(4,Math.round(m.width/4)*4),h=Math.max(4,Math.round(m.height/4)*4);
  const png=path.join(tmp,i+'.png'),ktx=path.join(tmp,i+'.ktx2');
  await img.resize(w,h,{fit:'fill'}).png().toFile(png);
  const a=['--t2','--genmipmap','--assign_oetf',srgb?'srgb':'linear','--assign_primaries',srgb?'bt709':'none'];
  if(nrm&&process.env.NU)a.push('--encode','uastc','--uastc_quality','2','--uastc_rdo_l','2','--zcmp','19');
  else if(nrm)a.push('--encode','etc1s','--clevel','2','--qlevel','255');
  else a.push('--encode','etc1s','--clevel','2','--qlevel','160');
  execFileSync('toktx',[...a,ktx,png],{stdio:'pipe'});
  t.setImage(new Uint8Array(fs.readFileSync(ktx))).setMimeType('image/ktx2');
  if(t.getURI())t.setURI(t.getURI().replace(/\.\w+$/,'.ktx2'))}
fs.rmSync(tmp,{recursive:true,force:true});
if(!doc.getRoot().listTextures().some(t=>t.getMimeType()==='image/webp'))for(const e of doc.getRoot().listExtensionsUsed())if(e.extensionName==='EXT_texture_webp')e.dispose();
doc.createExtension(KHRTextureBasisu).setRequired(true);
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
await io.write(out,doc);
