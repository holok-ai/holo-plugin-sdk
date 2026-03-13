import 'reflect-metadata';
import {EventEmitter} from 'node:events';
import {NotificationController} from '../notification.controller';

jest.mock('@holokai/sdk', () => ({
    ClassLogger: class {
        mlog() {
            return {
                info: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                debug: jest.fn(),
            };
        }
    },
    pickDefined: (value: Record<string, unknown>) => Object.fromEntries(
        Object.entries(value).filter(([, entry]) => entry !== undefined)
    ),
    stringifyAny: (value: unknown) => String(value),
}));

jest.mock('@holokai/sdk/notification', () => ({
    NotificationServiceToken: Symbol('NotificationService'),
}));

jest.mock('../../../utils', () => ({
    BaseController: class {
        mlog() {
            return {
                info: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                debug: jest.fn(),
            };
        }
    },
}));

describe('NotificationController', () => {
    it('subscribes with the caller threadId from the SSE query string', async () => {
        const notificationService = {
            subscribe: jest.fn().mockResolvedValue({
                id: 'sub-1',
                filter: {},
                q: (async function* () {
                    return;
                })(),
            }),
            unsubscribe: jest.fn().mockResolvedValue(true),
        };

        const controller = new NotificationController(notificationService as any);
        const req = new EventEmitter() as any;
        req.auth = {
            organizationId: 'org-1',
            userId: 'user-1',
            application: {
                url_slug: 'app-1',
            },
        };
        req.query = {
            threadId: 'thread-1',
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
            flushHeaders: jest.fn(),
            write: jest.fn().mockReturnValue(true),
            end: jest.fn(),
        };

        await controller.stream(req, res as any);

        expect(notificationService.subscribe).toHaveBeenCalledWith({
            organizationId: 'org-1',
            userId: 'user-1',
            appSlug: 'app-1',
            threadIds: ['thread-1'],
        });
    });
});
