import * as path from "path";
import jsonfile from 'jsonfile'
import * as fs from "fs";

export class TestFile {
    private folderPathData = path.join(__dirname, '..', 'integrations', 'data')

    constructor(private nameFile: string) {
        this.createFolder()
    }

    generateTestFile(jsonObj: Object): void {
        jsonfile.writeFileSync(path.join(this.folderPathData, `${this.nameFile}.json`), jsonObj)
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
