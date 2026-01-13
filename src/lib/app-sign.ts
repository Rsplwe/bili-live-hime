import { md5 } from 'js-md5';

type Params = Record<string, string>

const appKey = "aae92bc66f3edfab"
const appSec = "af125a0d5279fd576c1b4418a3e8276d"

export function appSign(params: Params) {
    params.appkey = appKey
    const searchParams = new URLSearchParams(params)
    searchParams.sort()
    return `${searchParams.toString()}&sign=${md5(searchParams.toString() + appSec)}`
}