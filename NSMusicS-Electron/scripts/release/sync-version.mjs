import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const packageJsonPath = path.join(projectRoot, 'package.json')
const appVersionModulePath = path.join(projectRoot, 'src', 'config', 'app_version.ts')
const xmlPath = path.join(projectRoot, 'resources', 'config', 'NSMusicS.xml')

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Invalid package.json version: ${version}`)
}

const writeIfChanged = (filePath, nextContent) => {
  const currentContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null
  if (currentContent === nextContent) {
    return false
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, nextContent, 'utf8')
  return true
}

const appVersionModule = `export const APP_VERSION = '${version}'\n`
const versionModuleChanged = writeIfChanged(appVersionModulePath, appVersionModule)

const xmlContent = fs.readFileSync(xmlPath, 'utf8')
const nextXmlContent = xmlContent
  .replace(/<version>.*?<\/version>/, `<version>${version}</version>`)
  .replace(/(\n\s*)(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)已更新内容;/, `$1${version}已更新内容;`)

if (nextXmlContent === xmlContent) {
  if (!xmlContent.includes(`<version>${version}</version>`)) {
    throw new Error(`Unable to sync version tag in ${path.relative(projectRoot, xmlPath)}`)
  }
} else {
  fs.writeFileSync(xmlPath, nextXmlContent.replace(/\r\n?/g, '\n'), 'utf8')
}

const changedFiles = []
if (versionModuleChanged) {
  changedFiles.push(path.relative(projectRoot, appVersionModulePath))
}
if (nextXmlContent !== xmlContent) {
  changedFiles.push(path.relative(projectRoot, xmlPath))
}

console.log(`[version-sync] package version: ${version}`)
console.log(
  `[version-sync] updated files: ${changedFiles.length > 0 ? changedFiles.join(', ') : 'none'}`
)
process.exit(0)
