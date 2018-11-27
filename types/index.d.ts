interface Options {
	beforeSend?(xhr): void | boolean,
	afterResponse?(data, xhr): void,
	retry?: number
};

export default function (options?: Options): object;