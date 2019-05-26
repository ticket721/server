import { PriceModel } from '../models';

export const MarketerTester = async (sale: any, event: any, sale_contract_type: any, web3: any, height: number): Promise<void> => {

    if (sale.relations.prices.length === 0) {
        try {
            const contract_address = event.relations.address.attributes.address;
            const abi = sale_contract_type.attributes.abi;

            const contract = new web3.eth.Contract(abi, contract_address);
            const ticket_id = sale.relations.ticket.attributes.ticket_id;

            const price = await contract.methods.getSellPrice(ticket_id).call();

            const ether_price = new PriceModel({
                currency: 'ether',
                value: price,
                sale: sale.id
            });

            await ether_price.save();

            sale.set('update_height', height);

            await sale.save();

        } catch (e) {
            console.error(e);
            console.error(`Unable to recover prices for sale ${sale.attributes.id}`);
        }
    } else {
        try {
            sale.set('update_height', height);

            await sale.save();
        } catch (e) {
            console.error(e);
            console.error(`Unable to update height for sale ${sale.attributes.id}`);
        }
    }
};
