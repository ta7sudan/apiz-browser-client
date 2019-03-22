import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import minify from 'rollup-plugin-babel-minify';
import resolve from 'rollup-plugin-node-resolve';
import { relative } from 'path';
import { browser, module, version, license, author, homepage } from './package.json';

/**
 * 如果用babel-minify压缩的话, banner字符串的开头和结尾谜之不能换行
 * 不过有一点好的是, 用rollup的banner字段和babel-minify的banner字段都可以
 * uglify的话则需要自己处理下注释
 */
const banner = `/**
 * @Version ${version}
 * @Author: ${author}
 * @Repo: ${homepage}
 * @License: ${license}
 */`;

/**
 * 
 * 如果把tinyjx作为构建时依赖, 那tinyjx升级版本这里就也要跟着升级版本,
 * 这就有些傻屌, 如果作为运行时依赖不打包进去, 但Webpack的babel通常
 * 又不会扫node_modules, 那这个运行时依赖等于缺失, 这也很傻屌...
 * 那他妈的还是作为构建时依赖打包进去吧...
 * 
 */

export default [
	{
		input: 'src/index.ts',
		plugins: [
			typescript({
				tsconfig: 'tsconfig.json',
				useTsconfigDeclarationDir: true
			}),
			replace({
				DEBUG: JSON.stringify(false)
			}),
			babel({
				exclude: 'node_modules/**',
				extensions: ['.js', '.ts']
			})
		],
		external: ['tinyjx'],
		treeshake: {
			propertyReadSideEffects: false
		},
		output: [
			{
				file: module,
				format: 'esm',
				sourcemap: true
			},
			{
				name: 'ApizClient',
				file: browser,
				format: 'umd',
				sourcemap: true,
				globals: {
					tinyjx: 'tinyjx'
				}
			}
		]
	},
	{
		input: 'src/index.ts',
		plugins: [
			resolve(),
			typescript({
				tsconfig: 'tsconfig.json',
				useTsconfigDeclarationDir: true
			}),
			replace({
				DEBUG: JSON.stringify(false)
			}),
			babel({
				exclude: 'node_modules/**',
				extensions: ['.js', '.ts']
			}),
			minify({
				comments: false
			})
		],
		external: ['tinyjx'],
		treeshake: {
			propertyReadSideEffects: false
		},
		output: {
			name: 'ApizClient',
			banner,
			file: 'dist/apizclient.min.js',
			format: 'umd',
			sourcemap: true,
			// sourcemap生成之后在devtools本来看到的文件是src/index.js, 这个选项可以变成apizclient.js
			sourcemapPathTransform: path => ~path.indexOf('index') ? 'apizclient.js' : relative('src', path),
			globals: {
				tinyjx: 'tinyjx'
			}
		}
	}
];
