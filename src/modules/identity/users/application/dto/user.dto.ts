import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, Matches } from "class-validator";

const cpfCnpjPattern = /^(\d{11}|\d{14})$/;

export class CreateUserDto {
  @ApiProperty({ example: "Maria Silva" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "maria@email.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "123.456.789-00" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\D/g, "") : value,
  )
  @IsString()
  @Matches(cpfCnpjPattern, {
    message: "cpfcnpj deve ser um CPF com 11 digitos ou CNPJ com 14 digitos",
  })
  cpfcnpj!: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "Maria Silva" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "maria@email.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "123.456.789-00" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\D/g, "") : value,
  )
  @IsString()
  @Matches(cpfCnpjPattern, {
    message: "cpfcnpj deve ser um CPF com 11 digitos ou CNPJ com 14 digitos",
  })
  cpfcnpj?: string;
}

export class UserDto {
  @ApiProperty({ example: "b9c17719-3f5f-4bcf-a63f-1f2e9bcd8f4c" })
  id!: string;

  @ApiProperty({ example: "Maria Silva" })
  name!: string;

  @ApiProperty({ example: "maria@email.com" })
  email!: string;

  @ApiProperty({ example: "123.456.789-00" })
  cpfcnpj!: string;

  @ApiProperty({ example: "2026-03-30T19:30:00.000Z" })
  createdAt!: Date;

  @ApiProperty({ example: "2026-03-30T19:30:00.000Z" })
  updatedAt!: Date;
}