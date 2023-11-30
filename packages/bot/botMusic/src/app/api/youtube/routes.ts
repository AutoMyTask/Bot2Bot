const constructQueryParameters = (parameters : any) => Object
    .keys(parameters)
    .map(key => `${key}=${encodeURIComponent(parameters[key])}`)
    .join('&')

export default {
    channel: ({parameters = {}}) => {
        return `channels/?${constructQueryParameters(parameters)}`
    }

}
