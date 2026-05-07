import { Module } from "@nestjs/common";
import { PetsModule } from "./pets/pets.module";

@Module({
  imports: [PetsModule],
  exports: [PetsModule],
})
export class CatalogModule {}
