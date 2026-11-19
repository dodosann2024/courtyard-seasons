// node tools/glbpack/albedo.mjs <in.glb> <out.webp>  -- the base colour of a GLB's first material as a 1024 px WebP.
// For Godot's colourway twins (e.g. sinai_agama_*_blue.glb: same mesh, rig and other maps, only the base colour differs):
// the scene loads the main GLB once and mixes this texture in, rather than a second copy of the whole model.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
const [,,inp,out]=process.argv;
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(inp);
const tex=doc.getRoot().listMaterials().map(m=>m.getBaseColorTexture()).find(Boolean);
if(!tex)throw new Error(`${inp}: no base colour texture`);
fs.writeFileSync(out,await sharp(Buffer.from(tex.getImage())).resize(1024,1024).webp({quality:88,effort:5}).toBuffer());
