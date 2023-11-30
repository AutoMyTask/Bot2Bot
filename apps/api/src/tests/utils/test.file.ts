import * as path from "path";
import jsonfile from 'jsonfile'
import * as fs from "fs";

export class TestFile {
    private folderPathData = path.join(__dirname, '..', 'integrations', 'data')

    constructor(private nameFile: string) {
        this.createFolder()
    }

    private get filePath(){
        return path.join(this.folderPathData, `${this.nameFile}.json`)
    }

    generateTestFile(jsonObj: Object): void {
        jsonfile.writeFileSync(this.filePath, jsonObj, {spaces: 2})
    }

    fileExist(): boolean {
        return fs.existsSync(this.filePath)
    }

    get value(){
        return jsonfile.readFileSync(this.filePath)
    }

    private createFolder(): void {
        if (!fs.existsSync(this.folderPathData)) {
            fs.mkdir(this.folderPathData, {recursive: true}, (err) => {
                if (err) {
                    console.error('Erreur lors de la création du dossier :', err);
                } else {
                    console.log('Dossier créé avec succès.');
                }
            });
        }
    }
}
