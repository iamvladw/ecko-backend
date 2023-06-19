import fs from 'fs';

interface PackageJson {
    name: string;
    version: string;
    author: string;
    license: string;
}

// Read the package.json file
const packageJsonData = fs.readFileSync('./package.json', 'utf8');

// Parse the JSON data into a PackageJson object
const packageJson: PackageJson = JSON.parse(packageJsonData);

export default packageJson;
