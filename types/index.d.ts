export default function (options?: {
	beforeSend?(xhr): void | boolean;
	afterResponse?(data, xhr): void;
}): object;