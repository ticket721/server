import Knex = require('knex');
import Bookshelf = require('bookshelf');

export let AddressModel = null;
export let ActionModel = null;
export let TicketModel = null;
export let HeightModel = null;
export let EventModel = null;
export let SaleModel = null;
export let ECModel = null;
export let QEModel = null;
export let PriceModel = null;
export let MinterModel = null;
export let MarketerModel = null;
export let ApproverModel = null;
export let UploadFileModel = null;
export let UploadFileMorphModel = null;
export let EVMEventModel = null;

export const init = (knex: Knex): void => {

    const bs: any = Bookshelf(knex);

    bs.plugin('registry');

    AddressModel = bs.model('Address', (bs.Model.extend({tableName: 'address', hasTimestamps: true}) as any) as Bookshelf.Model<any>);
    ActionModel = bs.model('Action', (bs.Model.extend({tableName: 'action', hasTimestamps: true}) as any) as Bookshelf.Model<any>);
    HeightModel = bs.model('Height', (bs.Model.extend({tableName: 'height', hasTimestamps: true}) as any) as Bookshelf.Model<any>);
    TicketModel = bs.model('Ticket', (bs.Model.extend({tableName: 'ticket', hasTimestamps: true}) as any) as Bookshelf.Model<any>);
    PriceModel = bs.model('Price', (bs.Model.extend({tableName: 'price', hasTimestamps: true}) as any) as Bookshelf.Model<any>);
    MinterModel = bs.model('Minter', (bs.Model.extend({tableName: 'minters', hasTimestamps: true}) as any) as Bookshelf.Model<any>);
    MarketerModel = bs.model('Marketer', (bs.Model.extend({tableName: 'marketers', hasTimestamps: true}) as any) as Bookshelf.Model<any>);
    ApproverModel = bs.model('Approver', (bs.Model.extend({tableName: 'approver', hasTimestamps: true}) as any) as Bookshelf.Model<any>);
    UploadFileMorphModel = bs.model('UploadFileMorph', (bs.Model.extend({tableName: 'upload_file_morph'}) as any) as Bookshelf.Model<any>);
    UploadFileModel = bs.model('UploadFile', (bs.Model.extend({tableName: 'upload_file'}) as any) as Bookshelf.Model<any>);
    EVMEventModel = bs.model('EVMEvent', (bs.Model.extend({tableName: 'evmevent'}) as any) as Bookshelf.Model<any>);

    QEModel = bs.model('QueuedEvent', (bs.Model.extend({tableName: 'queuedevents', hasTimestamps: true,
        image (): any {
            return this
                .morphOne(UploadFileMorphModel, 'related', ['related_type', 'related_id'])
                .query(function(qb: any): void {
                    qb.where('field', '=', 'image');
                });
        },
        banners (): any {
            return this
                .morphMany(UploadFileMorphModel, 'related', ['related_type', 'related_id'])
                .query(function(qb: any): void {
                    qb.where('field', '=', 'banners');
                });
        }
    }) as any) as Bookshelf.Model<any>);

    EventModel = bs.model('Event', (bs.Model.extend({tableName: 'event', hasTimestamps: true,
        address (): any {
            return this.belongsTo(AddressModel, 'address');
        }
    }) as any) as Bookshelf.Model<any>);

    SaleModel = bs.model('Sale', (bs.Model.extend({tableName: 'sale', hasTimestamps: true,
        ticket (): any {
            return this.belongsTo(TicketModel, 'ticket');
        },
        event (): any {
            return this.belongsTo(EventModel, 'event');
        },
        prices (): any {
            return this.hasMany(PriceModel, 'sale');
        }
    }) as any) as Bookshelf.Model<any>);

    ECModel = bs.model('EventContract', (bs.Model.extend({tableName: 'eventcontract', hasTimestamps: true,
        minter (): any {
            return this.belongsTo(MinterModel, 'minter');
        },
        marketer (): any {
            return this.belongsTo(MarketerModel, 'marketer');
        },
        approver (): any {
            return this.belongsTo(ApproverModel, 'approver');
        }
    }) as any) as Bookshelf.Model<any>);

};
