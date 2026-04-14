import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  CreateUserDto,
  UpdateUserDto,
  UserDto,
} from "@identity/users/application/dto/user.dto";
import { UsersService } from "@identity/users/application/services/users.service";
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Cria um usuario" })
  @ApiOkResponse({ type: UserDto })
  create(@Body() payload: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: "Lista todos os usuarios" })
  @ApiOkResponse({ type: UserDto, isArray: true })
  findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Busca usuario por id" })
  @ApiOkResponse({ type: UserDto })
  findById(@Param("id") id: string): Promise<UserDto> {
    return this.usersService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Atualiza dados de um usuario" })
  @ApiOkResponse({ type: UserDto })
  update(
    @Param("id") id: string,
    @Body() payload: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(id, payload);
  }

  @Delete(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "Remove um usuario" })
  @ApiNoContentResponse({ description: "Usuario removido com sucesso" })
  async delete(@Param("id") id: string): Promise<void> {
    await this.usersService.delete(id);
  }
}