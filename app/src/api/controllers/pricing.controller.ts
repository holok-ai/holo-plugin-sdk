import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {HoloError} from '@holokai/sdk';
import {ApiResponse, BaseController} from '../../utils';
import {HoloApiRequest} from '../types';
import {PricingService} from '../../services';

@injectable()
export class PricingController extends BaseController {
    constructor(private pricingService: PricingService) {
        super();
    }

    recalculate = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        const {from, to, provider_id} = req.body;

        if (!from || !to) throw HoloError.badRequest('from and to are required');

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) throw HoloError.badRequest('from and to must be valid dates');

        const result = await this.pricingService.recalculateCostsForDateRange(fromDate, toDate, provider_id);

        res.json({
            success: true,
            data: {
                row_count: result.rowCount,
                total_cost: result.totalCost,
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
                provider_id: provider_id ?? null,
            },
            timestamp: new Date().toISOString()
        });
    };
}
