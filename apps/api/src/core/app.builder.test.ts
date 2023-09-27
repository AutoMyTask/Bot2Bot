import {beforeAll, describe, expect} from "@jest/globals";
import {App, AppBuilder, IApp, IAppBuilder} from "./app.builder";
import {IsInt, IsNotEmpty, IsString} from "class-validator";
import {Params} from "./request/params/decorators/params.path.decorator";
import {Body} from "./request/params/decorators/params.body.decorator";
import {IRouteMapBuilder} from "./routes/types";

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
    let builder: IAppBuilder
    let appInstanceMapBuilder: IRouteMapBuilder

    beforeAll(() => {
        const config = {port: '3000'}
        builder =  AppBuilder.createAppBuilder(config)
    })

    it('should create an instance of App ', function () {
        expect(builder).toBeInstanceOf(AppBuilder)
    });



    it('should add endpoint to baseRouteBuilders', function () {
        builder.addEndpoint((builder) => {
            builder
                .map('/oui/:id/:username', 'get', UserController, UserController.findOne)

            builder
                .map('/non/:id/:username', "get", UserController, UserController.findOne)

            const nonGroup = builder.mapGroup('/non')
            const ouiGroup = builder.mapGroup('/oui')


            expect(builder.routesBuilders.length).toEqual(4)
            return builder
        })
    });
})
