// node tools/glbpack/pack.mjs <in.glb> <out.glb>  -- meshopt-compress one of the scene's GLBs (run on the original handover file)
// Positions stay float: shaders in src/desert.js read bind-pose metres from `position` (camel coat, sway), which
// quantised positions would turn into normalised units. Normals, uvs, joints and weights are quantised.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,EXTMeshoptCompression} from '@gltf-transform/extensions';
import {quantize,reorder,textureCompress,dedup} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
import path from 'path';
const [,,inp,out]=process.argv;
const key=path.basename(inp,'.glb');
/* per file: how its textures are stored. Re-encoding the snakes' JPEGs as WebP made them larger, so the phone file keeps
   them; the desktop body strips (1800x3508, ~9 px per mm of snake) go to 70 % as WebP */
const TEX={
  rattlesnake_v1i_mobile:[],
  rattlesnake_v1i:[textureCompress({encoder:sharp,targetFormat:'webp',quality:85,effort:5,resize:[1260,2456],pattern:/tex_body/})],
  /* a 25 cm lizard: 1024 px colour and 512 px normal/ORM still give ~4 px per mm of animal.
     v1c and its blue twin share this cap (colour arrives at 2048). */
  ...Object.fromEntries(['sinai_agama_v1b','sinai_agama_v1c','sinai_agama_v1c_blue'].map(k=>[k,[
    textureCompress({encoder:sharp,targetFormat:'webp',quality:88,effort:5,resize:[1024,1024],slots:/baseColor/}),
    textureCompress({encoder:sharp,targetFormat:'webp',quality:90,effort:5,resize:[512,512],slots:/^(?!baseColor)/})]])),
  /* a 2.45 m bird seen from a metre or two: plumage colour stays 2048 px. v2e is v2d with a deeper sit. */
  ...Object.fromEntries(['ostrich_v2c','ostrich_v2d','ostrich_v2e','ostrich_v2g','ostrich_v2z2','ostrich_v2af','ostrich_v2ag'].map(k=>[k,[
    textureCompress({encoder:sharp,targetFormat:'webp',quality:88,effort:5,resize:[1024,1024],slots:/^(?!baseColor)/}),
    textureCompress({encoder:sharp,targetFormat:'webp',quality:88,effort:5,slots:/baseColor/})]])),
  /* 38, 14 and 13 cm animals: 1024 px colour, 512 px normal/ORM; the gerbil's 256 px whisker card is left alone */
  ...Object.fromEntries(['tortoise_v2g','gerbil_v4d','scorpion_v2b','scorpion_uv_v2b'].map(k=>[k,[
    textureCompress({encoder:sharp,targetFormat:'webp',quality:88,effort:5,resize:[1024,1024],slots:/baseColor/}),
    textureCompress({encoder:sharp,targetFormat:'webp',quality:90,effort:5,resize:[512,512],slots:/^(?!baseColor)/})]])),
  /* a 40 cm trout seen through a metre of water: body colour and fin atlas 1024 px (from 2048), normal/ORM 512 px */
  ...Object.fromEntries(['trout_v2','trout_v3'].map(k=>[k,[
    textureCompress({encoder:sharp,targetFormat:'webp',quality:88,effort:5,resize:[1024,1024],slots:/baseColor/}),
    textureCompress({encoder:sharp,targetFormat:'webp',quality:90,effort:5,resize:[512,512],slots:/^(?!baseColor)/})]])),
};
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(inp);
await doc.transform(dedup(),reorder({encoder:MeshoptEncoder,target:'size'}),
  quantize({pattern:/^(NORMAL|TANGENT|TEXCOORD_\d+|JOINTS_\d+|WEIGHTS_\d+|COLOR_\d+)$/,quantizeNormal:10,quantizeTexcoord:14,quantizeWeight:8,patternTargets:/^$/}),
  ...(TEX[key]||[textureCompress({encoder:sharp,targetFormat:'webp',quality:88,effort:5})]));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
await io.write(out,doc);
