interface Options {
	beforeSend?(xhr: XMLHttpRequest): void | boolean,
	afterResponse?(resData: any, status: string, xhr: XMLHttpRequest, url: string, reqData: any): void,
	complete?(resData: any, xhr: XMLHttpRequest, url: string, reqData: any): void,
	retry?: number
}

export default function (options?: Options): object;