import commonjs from "rollup-plugin-commonjs";
import less from "rollup-plugin-less";
import replace from "rollup-plugin-replace";
import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

export default {
    input: './src/mount.ts',
    output: {
        file: './public/js/app.js',
        format: 'iife',
        globals: {
            fs: false,
            path: false,
            crypto: false
        }
    },
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        typescript({tsconfig: './tsconfig.json'}),
        resolve(),
        commonjs({
            namedExports: {
                'node_modules/react-dom/index.js': [
                    'render',
                ],
                'node_modules/react/index.js': [
                    'Component',
                    'PropTypes',
                    'createElement',
                    'Children'
                ],
                'node_modules/react-form/dist/index.js': [
                    'Form',
                    'Text',
                    'Select',
                    'StyledSelect',
                    'StyledText'
                ],
                'node_modules/react-if/lib/ReactIf.js': [
                    'If',
                    'Then',
                    'Else'
                ],
                'node_modules/prop-types/index.js': [
                    'object'
                ],
                'node_modules/lodash/lodash.js': [
                    'filter'
                ],
                'node_modules/lz-string/libs/lz-string.js': [
                    'compressToEncodedURIComponent',
                    'decompressFromEncodedURIComponent'
                ],
                'node_modules/react-is/index.js': [
                    'isValidElementType'
                ]
            }
        }),
        less({
            output: './public/css/style.css'
        })
    ]
};