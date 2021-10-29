import { app } from 'electron';
import moment from 'moment';
import { BaseExporter } from '../BaseExporter';

export class SqlExporter extends BaseExporter {
   constructor (client, options) {
      super(options);
      this._client = client;
      this._commentChar = '#';
   }

   get schemaName () {
      return this._options.schema;
   }

   get host () {
      return this._client._params.host;
   }

   async getServerVersion () {
      const version = await this._client.getVersion();
      return `${version.name} ${version.number}`;
   }

   async dump () {
      const exportState = {
         totalItems: this._options.items.length,
         currentItemIndex: 0,
         currentItem: '',
         op: ''
      };

      const header = await this.getSqlHeader();
      this.writeString(header);
      this.writeString('\n\n\n');

      for (const item of this._options.items) {
         // user abort operation
         if (this.isCancelled)
            return;

         // skip item if not set to output any detail for them
         if (!item.includeStructure && !item.includeContent && !item.includeDropStatement)
            continue;

         exportState.currentItemIndex++;
         exportState.currentItem = item.table;
         exportState.op = 'PROCESSING';

         this.emitUpdate(exportState);

         const tableHeader = this.buildComment(`Dump of table ${item.table}\n------------------------------------------------------------`);
         this.writeString(tableHeader);
         this.writeString('\n\n');

         if (item.includeDropStatement) {
            const dropTableSyntax = this.getDropTable(item.table);
            this.writeString(dropTableSyntax);
            this.writeString('\n\n');
         }

         if (item.includeStructure) {
            const createTableSyntax = await this.getCreateTable(item.table);
            this.writeString(createTableSyntax);
            this.writeString('\n\n');
         }

         if (item.includeContent) {
            exportState.op = 'FETCH';
            this.emitUpdate(exportState);
            const tableInsertSyntax = await this.getTableInsert(item.table);

            exportState.op = 'WRITE';
            this.emitUpdate(exportState);
            this.writeString(tableInsertSyntax);
            this.writeString('\n\n');
         }

         this.writeString('\n\n');
      }

      const footer = await this.getFooter();
      this.writeString(footer);
   }

   buildComment (text) {
      return text.split('\n').map(txt => `${this._commentChar} ${txt}`).join('\n');
   }

   async getSqlHeader () {
      const serverVersion = await this.getServerVersion();
      const header = `************************************************************
Antares - SQL Client
Version ${app.getVersion()}

https://antares-sql.app/
https://github.com/Fabio286/antares

Host: ${this.host} (${serverVersion})
Database: ${this.schemaName}
Generation time: ${moment().format()}
************************************************************`;

      return this.buildComment(header);
   }

   async getFooter () {
      return '';
   }

   getCreateTable (tableName) {
      throw new Error('Sql Exporter must implement the "getCreateTable" method');
   }

   getDropTable (tableName) {
      throw new Error('Sql Exporter must implement the "getDropTable" method');
   }

   getTableInsert (tableName) {
      throw new Error('Sql Exporter must implement the "getTableInsert" method');
   }
}
