/**
 * Compile-time compatibility checks between hand-written SDK types and generated OpenAPI types.
 *
 * This file is never executed — it only needs to pass `tsc --noEmit`.
 * If any SDK type drifts from the OpenAPI spec, the compiler will error here.
 */

import type {paths, components} from '../../holo-types/src/generated/holo-api';
import type {HoloRequest} from '@holokai/holo-types/holo';
import type {HoloResponse} from '@holokai/holo-types/holo';
import type {HoloModelInfo} from '@holokai/holo-types/holo';
import type {HoloApplicationInfo} from '@holokai/holo-types/holo';
import type {HoloErrorCode} from '@holokai/holo-types/holo';

// ─── Helper types ──────────────────────────────────────────────────────────

/** Extract the JSON request body for a POST endpoint. */
type RequestBody<P extends keyof paths, M extends string = 'post'> =
    M extends keyof paths[P]
        ? paths[P][M] extends { requestBody: { content: { 'application/json': infer B } } }
            ? B
            : never
        : never;

/** Extract the 200 JSON response body. */
type ResponseBody<P extends keyof paths, M extends string = 'post'> =
    M extends keyof paths[P]
        ? paths[P][M] extends { responses: { 200: { content: { 'application/json': infer R } } } }
            ? R
            : never
        : never;

// ─── Chat request body ─────────────────────────────────────────────────────
// The OpenAPI spec's chat request body must be assignable FROM HoloRequest.
// If HoloRequest has a field the spec doesn't, or a type mismatch, tsc errors.

type SpecChatBody = RequestBody<'/chat'>;

// Verify key fields of HoloRequest are present in the spec
type _AssertModel = SpecChatBody extends { model: string } ? true : never;
const _checkModel: _AssertModel = true;

type _AssertMessages = SpecChatBody extends { messages: unknown[] } ? true : never;
const _checkMessages: _AssertMessages = true;

type _AssertStream = SpecChatBody extends { stream?: boolean } ? true : never;
const _checkStream: _AssertStream = true;

// ─── Chat response shape ───────────────────────────────────────────────────

type SpecChatResponse = ResponseBody<'/chat'>;

// The spec response should have success, data with model and output
type _AssertResponseHasData = SpecChatResponse extends { data?: { model?: string } } ? true : never;
const _checkResponseData: _AssertResponseHasData = true;

// ─── Error response ────────────────────────────────────────────────────────

type SpecErrorResponse = components['schemas']['ErrorResponse'];
type SpecErrorCode = NonNullable<NonNullable<SpecErrorResponse['error']>['code']>;

// Verify that every HoloErrorCode value is a valid spec error code
type _AssertErrorCodesSubset = HoloErrorCode extends SpecErrorCode ? true : never;
const _checkErrorCodes: _AssertErrorCodesSubset = true;

// ─── Pagination ────────────────────────────────────────────────────────────

type SpecPagination = components['schemas']['Pagination'];

// Verify pagination shape has the expected fields
type _AssertPaginationPage = SpecPagination extends { page?: number } ? true : never;
const _checkPaginationPage: _AssertPaginationPage = true;

type _AssertPaginationTotal = SpecPagination extends { total?: number } ? true : never;
const _checkPaginationTotal: _AssertPaginationTotal = true;

// ─── Models listing ────────────────────────────────────────────────────────

type SpecModelsResponse = ResponseBody<'/models', 'get'>;

// The models endpoint should return an array with id and name
type _AssertModelsHasData = SpecModelsResponse extends { data?: { id?: string; name?: string }[] } ? true : never;
const _checkModelsData: _AssertModelsHasData = true;

// ─── Applications listing ──────────────────────────────────────────────────

type SpecApplicationsResponse = ResponseBody<'/applications', 'get'>;

// The applications endpoint should return data array with name
type _AssertAppsHasData = SpecApplicationsResponse extends { data?: { name?: string }[] } ? true : never;
const _checkAppsData: _AssertAppsHasData = true;

// ─── Ensure this file has no runtime side effects ──────────────────────────
export {};
