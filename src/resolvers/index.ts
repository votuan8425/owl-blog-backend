import { Query, Resolver } from 'type-graphql'

@Resolver()
export class HelloResolver {
    @Query(_return => String)
    hello() {
        return "hello yun"
    }
}