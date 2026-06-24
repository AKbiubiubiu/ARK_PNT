/**
 * 闭环验证测试 / Round-trip Validation Test
 * ================================================================
 * 使用用户提供的真实 .pnt 文件验证解析与再生成的闭环正确性。
 * Validates parse + regenerate round-trip using user's real .pnt file.
 */

const fs = require('fs');

// ---- 读取测试文件 / Read test files ----
const pntPath = '/tmp/ARK_PNT/2_Sign_PaintingCanvas_C.pnt';
const pngPath = '/tmp/ARK_PNT/2.png';

const pntBuffer = fs.readFileSync(pntPath);
const pngBuffer = fs.readFileSync(pngPath);

console.log('='.repeat(60));
console.log('闭环验证测试 / Round-trip Validation Test');
console.log('='.repeat(60));

// ---- 1. 解析原始 .pnt / Parse original .pnt ----
console.log('\n[1] 解析原始 .pnt 文件 / Parsing original .pnt file');
console.log('  文件大小:', pntBuffer.length, '字节');

const header = {
  reserved: pntBuffer.readUInt32LE(0),
  width: pntBuffer.readUInt32LE(4),
  height: pntBuffer.readUInt32LE(8),
  bitDepth: pntBuffer.readUInt32LE(12),
  dataSize: pntBuffer.readUInt32LE(16),
};

console.log('  文件头 / Header:');
console.log('    保留字段:', header.reserved);
console.log('    宽度:', header.width);
console.log('    高度:', header.height);
console.log('    位深:', header.bitDepth);
console.log('    数据大小:', header.dataSize);

// 校验头一致性 / Validate header consistency
const expectedDataSize = header.width * header.height;
const expectedTotalSize = 20 + expectedDataSize;
assertEqual(header.dataSize, expectedDataSize, '数据大小 = 宽×高');
assertEqual(header.bitDepth, 8, '位深 = 8');
assertEqual(pntBuffer.length, expectedTotalSize, '文件总大小 = 20 + 宽×高');

// ---- 2. 提取像素索引 / Extract pixel indices ----
console.log('\n[2] 提取像素 Color ID 索引 / Extracting pixel Color ID indices');
const pixelData = pntBuffer.subarray(20);
console.log('  像素数据长度:', pixelData.length);

// 统计唯一颜色 / Count unique colors
const uniqueColors = new Set();
for (const b of pixelData) uniqueColors.add(b);
console.log('  唯一 Color ID 数量:', uniqueColors.size);
console.log('  唯一 Color ID:', Array.from(uniqueColors).sort((a, b) => a - b).join(', '));

// ---- 3. 重新生成 .pnt / Regenerate .pnt ----
console.log('\n[3] 重新生成 .pnt 文件 / Regenerating .pnt file');

const regenBuffer = Buffer.alloc(expectedTotalSize);
// 写入文件头 / Write header
regenBuffer.writeUInt32LE(0, 0);
regenBuffer.writeUInt32LE(header.width, 4);
regenBuffer.writeUInt32LE(header.height, 8);
regenBuffer.writeUInt32LE(8, 12);
regenBuffer.writeUInt32LE(expectedDataSize, 16);
// 写入像素数据 / Write pixel data
pixelData.copy(regenBuffer, 20);

// ---- 4. 比较原始与重新生成 / Compare original vs regenerated ----
console.log('\n[4] 比较原始与重新生成的 .pnt / Comparing original vs regenerated');

let identical = true;
let diffCount = 0;
for (let i = 0; i < pntBuffer.length; i++) {
  if (pntBuffer[i] !== regenBuffer[i]) {
    identical = false;
    diffCount++;
    if (diffCount <= 5) {
      console.log('  差异 @' + i + ': 原始=' + pntBuffer[i] + ' 重新生成=' + regenBuffer[i]);
    }
  }
}

if (identical) {
  console.log('  OK 逐字节完全一致！/ Byte-for-byte identical!');
} else {
  console.log('  FAIL 发现 ' + diffCount + ' 处差异 / Found ' + diffCount + ' differences');
}

// ---- 5. 验证 Color ID 在调色板中 / Verify Color IDs exist in palette ----
console.log('\n[5] 验证 Color ID 是否在调色板中 / Verifying Color IDs in palette');

const validIds = new Set([0]);
for (let i = 1; i <= 100; i++) validIds.add(i);
for (let i = 201; i <= 226; i++) validIds.add(i);

let allValid = true;
for (const id of uniqueColors) {
  if (!validIds.has(id)) {
    console.log('  FAIL 未知 Color ID: ' + id);
    allValid = false;
  }
}
if (allValid) {
  console.log('  OK 所有 Color ID 均在有效范围内 / All Color IDs are valid');
}

// ---- 6. PNG 文件信息 / PNG file info ----
console.log('\n[6] PNG 测试图片信息 / PNG test image info');
console.log('  文件大小:', pngBuffer.length, '字节 (' + (pngBuffer.length / 1024).toFixed(1) + ' KB)');

// ---- 总结 / Summary ----
console.log('\n' + '='.repeat(60));
if (identical && allValid) {
  console.log('OK 闭环验证全部通过！/ Round-trip validation PASSED!');
} else {
  console.log('FAIL 闭环验证存在失败项 / Round-trip validation FAILED');
}
console.log('='.repeat(60));

// ---- 辅助函数 / Helper functions ----
function assertEqual(actual, expected, label) {
  if (actual === expected) {
    console.log('  OK ' + label + ': ' + actual);
  } else {
    console.log('  FAIL ' + label + ': 实际=' + actual + ', 预期=' + expected);
    process.exit(1);
  }
}
