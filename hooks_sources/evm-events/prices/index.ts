import { MarketerTester }     from './MarketerTester';
import { MarketerDirectSale } from './MarketerDirectSale';

export const update = async (sale: any, eventcontract: any, prices: any, web3: Web3, height: number): Promise<void> => {
    const event = sale.relations.event;

    const sale_contract_type = await eventcontract
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
                await MarketerTester(sale, event, sale_contract_type.models[0], prices, web3, height);

                break;
            }
            case 'MarketerDirectSale': {
                await MarketerDirectSale(sale, event, sale_contract_type.models[0], prices, web3, height);
            }
        }

    }

};
