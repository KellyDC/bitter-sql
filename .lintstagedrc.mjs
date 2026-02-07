export default {
    '*.{js,ts}': (filenames) => {
        // Filter out files that match ESLint's globalIgnores
        const filtered = filenames.filter(
            (file) =>
                !file.includes('tests/') &&
                !file.includes('dist/') &&
                !file.includes('coverage/') &&
                !file.includes('node_modules/')
        );

        return filtered.length > 0 ? `eslint --fix ${filtered.join(' ')}` : [];
    },
    '*.{js,ts,json,md}': 'prettier --write',
};
