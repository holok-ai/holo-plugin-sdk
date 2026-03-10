import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {BaseController, ApiResponse} from '../../utils/api';
import {HoloApiRequest} from '../types';
import {PricingService} from '../../services';

@injectable()
export class PricingController extends BaseController {
    constructor(private pricingService: PricingService) {
        super();
    }

    recalculate = async (req: HoloApiRequest, res: ApiResponse): Promise<void> => {
        try {
            const {from, to, provider_id} = req.body;

            if (!from || !to) {
                res.status(400).json({success: false, error: {message: 'from and to are required', code: 'VALIDATION_ERROR'}, timestamp: new Date().toISOString()});
                return;
            }

            const fromDate = new Date(from);
            const toDate = new Date(to);

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                res.status(400).json({success: false, error: {message: 'from and to must be valid dates', code: 'VALIDATION_ERROR'}, timestamp: new Date().toISOString()});
                return;
            }

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
        } catch (error) {
            this.handleError(res, error as Error, 'Failed to recalculate pricing');
        }
    };
}
