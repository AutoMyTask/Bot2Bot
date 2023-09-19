import {beforeAll, describe, expect} from "@jest/globals";
import {App, IApp} from "./app.builder";
import {IsInt, IsNotEmpty, IsString} from "class-validator";
import {Params} from "./request/params/decorators/params.path.decorator";
import {Body} from "./request/params/decorators/params.body.decorator";

class UserRequest {
    @IsInt()
    @IsNotEmpty()
    oui!: number

    @IsNotEmpty()
    @IsString()
    non!: string
}

class AuthOuiResponse {
    public oui!: boolean
}


class UserController {
    public static findOne(
        @Params('username') username: string,
        @Params('id', 'float') id: number
    ): AuthOuiResponse {
        return {oui: false}
    }

    public static postUser(
        @Params('id') id: number,
        @Body userRequest: UserRequest,
    ): { oui: boolean } {
        return {oui: true}
    }
}


describe('AppBuilder', () => {
    let appInstance: IApp

    beforeAll(() => {
        const config = {port: '3000'}
        appInstance =  App.createApp(config)
    })

    it('should create an instance of App ', function () {
        expect(appInstance).toBeInstanceOf(App)
    });

    it('should add endpoint to baseRouteBuilders', function () {
        appInstance.addEndpoint((builder) => {
            builder
                .map('/oui/:id/:username', 'get', UserController, UserController.findOne)

            builder
                .map('/non/:id/:username', "get", UserController, UserController.findOne)

            expect(builder.baseRouteBuilders.length).toEqual(2)
            return builder
        })


    });
})
