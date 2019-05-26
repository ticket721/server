import { MarketerTester }     from './MarketerTester';
import { MarketerDirectSale } from './MarketerDirectSale';
import { ECModel }            from '../models';

export const update = async (sale: any, web3: any, height: number): Promise<void> => {
    const event = sale.relations.event;

    const sale_contract_type = await ECModel
        .where({
            id: event.attributes.eventcontract
        })
        .fetchAll({
            withRelated: ['minter', 'marketer', 'approver']
        });

    if (sale_contract_type.length === 1) {
        const marketer = sale_contract_type.models[0].relations.marketer;

        switch (marketer.attributes.name) {
            case 'MarketerTester': {
                await MarketerTester(sale, event, sale_contract_type.models[0], web3, height);

                break;
            }
            case 'MarketerDirectSale': {
                await MarketerDirectSale(sale, event, sale_contract_type.models[0], web3, height);

                break ;
            }
        }

    }

};
